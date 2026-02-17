"""
Model training pipeline for APSRTC ML models.
Loads data, trains models, evaluates performance, and saves models.
"""
import asyncio
from services.data_loader import data_loader
from services.ml_models import delay_model, demand_model, anomaly_model, save_models
import pandas as pd
from datetime import datetime
import json
import os

async def train_all_models():
    """Train all ML models using available data."""
    print("="*60)
    print(" APSRTC ML Model Training Pipeline")
    print("="*60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {}
    
    # Load all data
    print("[1/4] Loading data...")
    data = data_loader.load_all_data()
    print(f"✓ Loaded {len(data)} datasets\n")
    
    # Train delay prediction model
    print("[2/4] Training delay prediction model...")
    delay_data = data_loader.prepare_delay_training_data()
    
    if delay_data is not None and len(delay_data) > 0:
        delay_results = delay_model.train(delay_data)
        results['delay_prediction'] = delay_results
    else:
        print("✗ Insufficient data for delay prediction model")
        results['delay_prediction'] = {'status': 'no_data'}
    print()
    
    # Train demand forecasting model
    print("[3/4] Training demand forecasting model...")
    demand_data = data_loader.prepare_demand_training_data()
    
    if demand_data is not None and len(demand_data) > 0:
        demand_results = demand_model.train(demand_data)
        results['demand_forecasting'] = demand_results
    else:
        print("✗ Insufficient data for demand forecasting model")
        results['demand_forecasting'] = {'status': 'no_data'}
    print()
    
    # Train anomaly detection model
    print("[4/4] Training anomaly detection model...")
    
    # Create synthetic bus data from loaded datasets
    bus_features = []
    
    if 'haltwise' in data:
        haltwise = data['haltwise']
        if 'delay_minutes' not in haltwise.columns and 'isCancelled' in haltwise.columns:
            haltwise['delay_minutes'] = haltwise['isCancelled'].apply(
                lambda x: 120 if x == 1 else pd.np.random.uniform(0, 15)
            )
        
        # Create bus-like records
        for _, row in haltwise.head(1000).iterrows():
            bus_features.append({
                'occupancy': pd.np.random.uniform(20, 95),
                'delay_minutes': row.get('delay_minutes', 0),
                'speed': pd.np.random.uniform(10, 60)
            })
    
    if bus_features:
        bus_df = pd.DataFrame(bus_features)
        anomaly_results = anomaly_model.train(bus_df)
        results['anomaly_detection'] = anomaly_results
    else:
        print("✗ No data for anomaly detection model")
        results['anomaly_detection'] = {'status': 'no_data'}
    print()
    
    # Save models
    print("Saving models...")
    save_models()
    print()
    
    # Save training results
    results_dir = "backend/models/trained"
    os.makedirs(results_dir, exist_ok=True)
    
    results_file = f"{results_dir}/training_results.json"
    results['timestamp'] = datetime.now().isoformat()
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"✓ Training results saved to {results_file}")
    
    # Print summary
    print("\n" + "="*60)
    print(" Training Summary")
    print("="*60)
    
    for model_name, result in results.items():
        if model_name == 'timestamp':
            continue
        print(f"\n{model_name.upper().replace('_', ' ')}:")
        if result.get('status') == 'success':
            print(f"  ✓ Status: SUCCESS")
            if 'r2_score' in result:
                print(f"  • R² Score: {result['r2_score']:.3f}")
            if 'rmse' in result:
                print(f"  • RMSE: {result['rmse']:.2f}")
            if 'mape' in result:
                print(f"  • MAPE: {result['mape']:.2f}%")
            if 'samples' in result:
                print(f"  • Training Samples: {result['samples']:,}")
        else:
            print(f"  ✗ Status: {result.get('status', 'FAILED')}")
    
    print("\n" + "="*60)
    print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    return results


if __name__ == "__main__":
    # Run training
    asyncio.run(train_all_models())
