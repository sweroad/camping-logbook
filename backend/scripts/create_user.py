"""CLI to seed a login. Usage: python -m scripts.create_user <username> <password> [display_name]"""

import getpass
import sys

from sqlalchemy import select

from app.database import SessionLocal
from app.models.user import User
from app.security import hash_password


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.create_user <username> [display_name]")
        sys.exit(1)

    username = sys.argv[1]
    display_name = sys.argv[2] if len(sys.argv) > 2 else None
    password = getpass.getpass("Password: ")
    confirm = getpass.getpass("Confirm password: ")

    if password != confirm:
        print("Passwords do not match.")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.username == username))
        if existing is not None:
            print(f"User '{username}' already exists.")
            sys.exit(1)

        user = User(username=username, password_hash=hash_password(password), display_name=display_name)
        db.add(user)
        db.commit()
        print(f"Created user '{username}'.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
