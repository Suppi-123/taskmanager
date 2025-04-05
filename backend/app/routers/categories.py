from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List
from datetime import datetime
from pony.orm import db_session, commit, select

from backend.app.models.database import User, Category
from backend.app.utils.auth_utils import get_current_user

router = APIRouter()


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    task_count: int = 0

    model_config = {
        "from_attributes": True
    }


@router.post("/", response_model=CategoryResponse)
@db_session
def create_category(category: CategoryCreate, current_user: User = Depends(get_current_user)):
    # Check if category with same name already exists for this user
    existing = Category.get(name=category.name, user_id=current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )

    # Create category
    new_category = Category(
        name=category.name,
        user_id=current_user.id
    )
    commit()

    return CategoryResponse(
        id=new_category.id,
        name=new_category.name,
        created_at=new_category.created_at,
        task_count=len(new_category.tasks)
    )


@router.get("/", response_model=List[CategoryResponse])
@db_session
def get_categories(current_user: User = Depends(get_current_user)):
    # Get system default categories and user's categories
    categories = select(c for c in Category if c.user_id == 0 or c.user_id == current_user.id)[:]

    result = []
    for category in categories:
        result.append(CategoryResponse(
            id=category.id,
            name=category.name,
            created_at=category.created_at,
            task_count=len(category.tasks.select(lambda t: t.user == current_user))
        ))

    return result


@router.get("/{category_id}", response_model=CategoryResponse)
@db_session
def get_category(category_id: int, current_user: User = Depends(get_current_user)):
    category = Category.get(id=category_id)

    if not category or (category.user_id != 0 and category.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    return CategoryResponse(
        id=category.id,
        name=category.name,
        created_at=category.created_at,
        task_count=len(category.tasks.select(lambda t: t.user == current_user))
    )


@router.put("/{category_id}", response_model=CategoryResponse)
@db_session
def update_category(category_id: int, category_update: CategoryUpdate, current_user: User = Depends(get_current_user)):
    category = Category.get(id=category_id)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Cannot update system categories
    if category.user_id == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update system categories"
        )

    # Only the owner can update their categories
    if category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this category"
        )

    # Check if name already exists
    if category.name != category_update.name:
        existing = Category.get(name=category_update.name, user_id=current_user.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )

    category.name = category_update.name
    commit()

    return CategoryResponse(
        id=category.id,
        name=category.name,
        created_at=category.created_at,
        task_count=len(category.tasks.select(lambda t: t.user == current_user))
    )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
@db_session
def delete_category(category_id: int, current_user: User = Depends(get_current_user)):
    category = Category.get(id=category_id)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Cannot delete system categories
    if category.user_id == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete system categories"
        )

    # Only the owner can delete their categories
    if category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this category"
        )

    # Remove category from associated tasks
    for task in category.tasks:
        if task.user == current_user:
            task.category = None

    category.delete()
    commit()

    return None