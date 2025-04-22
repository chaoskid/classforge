# seed_users.py
from database.db import SessionLocal
from database.models import Users
from werkzeug.security import generate_password_hash

def create_users():
    db = SessionLocal()
    try:
        users = [
            Users(user_email='Jason.Bailey@school.edu', password=generate_password_hash('jason'), user_type='student'),
            Users(user_email='teacher@example.com', password=generate_password_hash('teacher123'), user_type='teacher')
        ]
        db.add_all(users)
        db.commit()
        print("Sample users created successfully.")
    except Exception as e:
        db.rollback()
        print("Error:", e)
    finally:
        db.close()

if __name__ == '__main__':
    create_users()
