from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from pony.orm import db_session, commit, select
from enum import Enum

from backend.app.models.database import Task, Category, User
from backend.app.utils.auth_utils import get_current_user

router = APIRouter()


class PriorityEnum(str, Enum):
    high = "High"
    medium = "Medium"
    low = "Low"


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: PriorityEnum = PriorityEnum.medium
    due_date: Optional[datetime] = None
    category_id: Optional[int] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    due_date: Optional[datetime] = None
    category_id: Optional[int] = None
    is_completed: Optional[bool] = None


class TaskResponse(TaskBase):
    id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    category_name: Optional[str] = None

    model_config = {
        "from_attributes": True
    }


@router.post("/", response_model=TaskResponse)
@db_session
def create_task(task: TaskCreate, current_user: User = Depends(get_current_user)):
    # Check if category exists
    category = None
    if task.category_id:
        category = Category.get(id=task.category_id)
        if not category or (category.user_id != 0 and category.user_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )

    # Create task
    new_task = Task(
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        user=current_user,
        category=category
    )
    commit()

    # Prepare response
    response = TaskResponse(
        id=new_task.id,
        title=new_task.title,
        description=new_task.description,
        priority=new_task.priority,
        due_date=new_task.due_date,
        is_completed=new_task.is_completed,
        created_at=new_task.created_at,
        updated_at=new_task.updated_at,
        category_id=new_task.category.id if new_task.category else None,
        category_name=new_task.category.name if new_task.category else None
    )

    return response


@router.get("/", response_model=List[TaskResponse])
@db_session
def get_tasks(
        current_user: User = Depends(get_current_user),
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        is_completed: Optional[bool] = None,
        search: Optional[str] = None,
        priority: Optional[PriorityEnum] = None
):
    # Build query
    query = select(t for t in Task if t.user == current_user)

    # Apply filters
    if category_id is not None:
        query = query.filter(lambda t: t.category and t.category.id == category_id)

    if is_completed is not None:
        query = query.filter(lambda t: t.is_completed == is_completed)

    if search:
        query = query.filter(lambda t: search.lower() in t.title.lower())

    if priority:
        query = query.filter(lambda t: t.priority == priority)

    # Execute query with pagination
    tasks = query.order_by(Task.due_date, Task.created_at).limit(limit, offset=skip)[:]

    # Prepare response
    result = []
    for task in tasks:
        result.append(TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            due_date=task.due_date,
            is_completed=task.is_completed,
            created_at=task.created_at,
            updated_at=task.updated_at,
            category_id=task.category.id if task.category else None,
            category_name=task.category.name if task.category else None
        ))

    return result


@router.get("/{task_id}", response_model=TaskResponse)
@db_session
def get_task(task_id: int, current_user: User = Depends(get_current_user)):
    task = Task.get(id=task_id, user=current_user)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        is_completed=task.is_completed,
        created_at=task.created_at,
        updated_at=task.updated_at,
        category_id=task.category.id if task.category else None,
        category_name=task.category.name if task.category else None
    )


@router.put("/{task_id}", response_model=TaskResponse)
@db_session
def update_task(task_id: int, task_update: TaskUpdate, current_user: User = Depends(get_current_user)):
    task = Task.get(id=task_id, user=current_user)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Update category if provided
    if task_update.category_id is not None:
        if task_update.category_id == 0:
            task.category = None
        else:
            category = Category.get(id=task_update.category_id)
            if not category or (category.user_id != 0 and category.user_id != current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            task.category = category

    # Update other fields
    if task_update.title is not None:
        task.title = task_update.title

    if task_update.description is not None:
        task.description = task_update.description

    if task_update.priority is not None:
        task.priority = task_update.priority

    if task_update.due_date is not None:
        task.due_date = task_update.due_date

    if task_update.is_completed is not None:
        task.is_completed = task_update.is_completed

    task.updated_at = datetime.utcnow()
    commit()

    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        is_completed=task.is_completed,
        created_at=task.created_at,
        updated_at=task.updated_at,
        category_id=task.category.id if task.category else None,
        category_name=task.category.name if task.category else None
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
@db_session
def delete_task(task_id: int, current_user: User = Depends(get_current_user)):
    task = Task.get(id=task_id, user=current_user)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task.delete()
    commit()

    return None


@router.put("/{task_id}/toggle", response_model=TaskResponse)
@db_session
def toggle_task_status(task_id: int, current_user: User = Depends(get_current_user)):
    task = Task.get(id=task_id, user=current_user)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task.is_completed = not task.is_completed
    task.updated_at = datetime.utcnow()
    commit()

    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        is_completed=task.is_completed,
        created_at=task.created_at,
        updated_at=task.updated_at,
        category_id=task.category.id if task.category else None,
        category_name=task.category.name if task.category else None
    )