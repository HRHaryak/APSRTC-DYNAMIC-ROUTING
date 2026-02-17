"""
Model initialization script.
Loads trained models or trains new ones if not available.
"""
import os
from pathlib import Path


def initialize_models():
    """Initialize or load ML models."""
    print("Initializing ML models...")
    
    try:
        from services.ml_models import delay_model, demand_model, anomaly_model, load_models
        from services.data_loader import data_loader
        
        model_dir = "backend/models/trained"
        
        # Try to load existing models
        if os.path.exists(model_dir):
            try:
                load_models(model_dir)
                print("✓ Loaded pre-trained models")
                
                # Check if models are actually trained
                if not (delay_model.is_trained or demand_model.is_trained or anomaly_model.is_trained):
                    print("⚠️ Models loaded but not trained, will train now...")
                    train_models_now()
                    
                return
            except Exception as e:
                print(f"✗ Error loading models: {e}")
                print("Will train new models...")
        
        # Train new models
        train_models_now()
        
    except Exception as e:
        print(f"✗ Error initializing models: {e}")
        print("Application will continue with mock predictions")


def train_models_now():
    """Train models immediately."""
    try:
        print("Training models from data files...")
        
        from services.model_trainer import train_all_models
        import asyncio
        
        # Run training
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(train_all_models())
        loop.close()
        
        print("✓ Model training completed")
        return results
        
    except Exception as e:
        print(f"✗ Error training models: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    initialize_models()
