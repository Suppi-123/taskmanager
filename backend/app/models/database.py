from datetime import datetime
from pony.orm import Database, Required, Optional, Set, PrimaryKey
from pony.orm import db_session
import os

db = Database()


class User(db.Entity):
    id = PrimaryKey(int, auto=True)
    username = Required(str, unique=True)
    email = Required(str, unique=True)
    password_hash = Required(str)
    tasks = Set('Task')
    created_at = Required(datetime, default=datetime.utcnow)


class Category(db.Entity):
    id = PrimaryKey(int, auto=True)
    name = Required(str)
    user_id = Required(int)
    tasks = Set('Task')
    created_at = Required(datetime, default=datetime.utcnow)


class Task(db.Entity):
    id = PrimaryKey(int, auto=True)
    title = Required(str)
    description = Optional(str)
    is_completed = Required(bool, default=False)
    priority = Required(str, default="Medium")  # High, Medium, Low
    due_date = Optional(datetime)
    user = Required(User)
    category = Optional(Category)
    created_at = Required(datetime, default=datetime.utcnow)
    updated_at = Required(datetime, default=datetime.utcnow)


def db_init():
    # Database configuration
    db_params = {
        "provider": "sqlite",
        "filename": "task_manager.sqlite",
        "create_db": True
    }

    # Connect to the database
    db.bind(**db_params)
    db.generate_mapping(create_tables=True)

    # Create initial data
    with db_session:
        # Create default categories if none exist
        if not Category.select().count():
            default_categories = ["Work", "Personal", "Shopping", "Health", "Education"]
            for category_name in default_categories:
                Category(name=category_name, user_id=0)  # User ID 0 for system defaults