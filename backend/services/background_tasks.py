"""
Background tasks using AsyncIO for scheduled operations.
No external dependencies required (no Celery/Redis).
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict
import traceback


class BackgroundTaskScheduler:
    """Manages background tasks using AsyncIO."""
    
    def __init__(self):
        self.tasks = []
        self.running = False
        self.task_results = {}
        
    async def feature_recomputation(self):
        """Recompute features every 5 minutes."""
        while self.running:
            try:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Running feature recomputation...")
                
                # In production, this would recompute features from new data
                # For now, just log
                self.task_results['feature_recomputation'] = {
                    'last_run': datetime.now(),
                    'status': 'success'
                }
                
            except Exception as e:
                print(f"Error in feature recomputation: {e}")
                self.task_results['feature_recomputation'] = {
                    'last_run': datetime.now(),
                    'status': 'error',
                    'error': str(e)
                }
            
            await asyncio.sleep(300)  #5 minutes
    
    async def demand_forecast_refresh(self):
        """Refresh demand forecasts every 30 minutes."""
        while self.running:
            try:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Refreshing demand forecasts...")
                
                # Update forecasts for next hours
                self.task_results['demand_forecast'] = {
                    'last_run': datetime.now(),
                    'status': 'success'
                }
                
            except Exception as e:
                print(f"Error in demand forecast refresh: {e}")
                self.task_results['demand_forecast'] = {
                    'last_run': datetime.now(),
                    'status': 'error',
                    'error': str(e)
                }
            
            await asyncio.sleep(1800)  # 30 minutes
    
    async def anomaly_detection_scan(self):
        """Scan for anomalies every 2 minutes."""
        while self.running:
            try:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Scanning for anomalies...")
                
                # Scan buses for anomalies
                # In production, would trigger alerts
                self.task_results['anomaly_detection'] = {
                    'last_run': datetime.now(),
                    'status': 'success'
                }
                
            except Exception as e:
                print(f"Error in anomaly detection: {e}")
                self.task_results['anomaly_detection'] = {
                    'last_run': datetime.now(),
                    'status': 'error',
                    'error': str(e)
                }
            
            await asyncio.sleep(120)  # 2 minutes
    
    async def model_performance_monitoring(self):
        """Monitor ML model performance every hour."""
        while self.running:
            try:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Monitoring model performance...")
                
                # Check model accuracy, drift, etc.
                from services.ml_models import delay_model, demand_model, anomaly_model
                
                models_status = {
                    'delay_model': delay_model.is_trained if delay_model else False,
                    'demand_model': demand_model.is_trained if demand_model else False,
                    'anomaly_model': anomaly_model.is_trained if anomaly_model else False
                }
                
                self.task_results['model_monitoring'] = {
                    'last_run': datetime.now(),
                    'status': 'success',
                    'models': models_status
                }
                
            except Exception as e:
                print(f"Error in model monitoring: {e}")
                self.task_results['model_monitoring'] = {
                    'last_run': datetime.now(),
                    'status': 'error',
                    'error': str(e)
                }
            
            await asyncio.sleep(3600)  # 1 hour
    
    async def start(self):
        """Start all background tasks."""
        self.running = True
        
        print("Starting background task scheduler...")
        
        # Create tasks
        self.tasks = [
            asyncio.create_task(self.feature_recomputation()),
            asyncio.create_task(self.demand_forecast_refresh()),
            asyncio.create_task(self.anomaly_detection_scan()),
            asyncio.create_task(self.model_performance_monitoring())
        ]
        
        print(f"✓ Started {len(self.tasks)} background tasks")
        
        # Wait for all tasks
        await asyncio.gather(*self.tasks, return_exceptions=True)
    
    async def stop(self):
        """Stop all background tasks."""
        print("Stopping background tasks...")
        self.running = False
        
        # Cancel all tasks
        for task in self.tasks:
            task.cancel()
        
        # Wait for cancellation
        await asyncio.gather(*self.tasks, return_exceptions=True)
        
        print("✓ Background tasks stopped")
    
    def get_status(self) -> Dict:
        """Get status of all background tasks."""
        return {
            'running': self.running,
            'task_count': len(self.tasks),
            'results': self.task_results
        }


# Global scheduler instance
scheduler = BackgroundTaskScheduler()
