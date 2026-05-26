"""
Migration script to add user_id column to projects table
Run this once to update the database schema
"""
from sqlalchemy import create_engine, text, inspect
from db import DATABASE_URL
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    """Add user_id column to projects table"""
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    # Check if column already exists using SQLAlchemy inspector (works for all databases)
    columns = [col['name'] for col in inspector.get_columns('projects')]
    
    if 'user_id' in columns:
        logger.info("Column 'user_id' already exists in projects table")
        return
    
    # Add user_id column
    logger.info("Adding user_id column to projects table...")
    
    with engine.connect() as conn:
        try:
            # SQLite syntax for adding column
            conn.execute(text("""
                ALTER TABLE projects 
                ADD COLUMN user_id INTEGER
            """))
            conn.commit()
            
            logger.info("Migration completed successfully!")
            logger.info("Note: Existing projects will have user_id=NULL")
            
        except Exception as e:
            logger.error(f"Migration failed: {str(e)}")
            conn.rollback()
            raise

if __name__ == "__main__":
    migrate()

# Made with Bob