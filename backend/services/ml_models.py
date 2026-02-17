"""
Real ML models for APSRTC predictions.
Includes delay prediction, demand forecasting, and anomaly detection.
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_percentage_error
import xgboost as xgb
from typing import Dict, Optional, Tuple
import joblib
import os
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

class DelayPredictionModel:
    """XGBoost-based delay prediction model."""
    
    def __init__(self):
        self.model = None
        self.label_encoders = {}
        self.feature_columns = []
        self.is_trained = False
        
    def prepare_features(self, df: pd.DataFrame, fit_encoders: bool = False) -> pd.DataFrame:
        """Prepare features for model training/prediction."""
        df = df.copy()
        
        # Encode categorical variables
        categorical_cols = ['ROUTE_ID', 'SERVICE_TYPE_NAME']
        
        for col in categorical_cols:
            if col in df.columns:
                if fit_encoders or col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col].astype(str))
                else:
                    # Handle unseen categories
                    df[f'{col}_encoded'] = df[col].astype(str).apply(
                        lambda x: self.label_encoders[col].transform([x])[0] 
                        if x in self.label_encoders[col].classes_ else -1
                    )
        
        # Select feature columns
        feature_cols = []
        
        if 'ROUTE_ID_encoded' in df.columns:
            feature_cols.append('ROUTE_ID_encoded')
        if 'SERVICE_TYPE_NAME_encoded' in df.columns:
            feature_cols.append('SERVICE_TYPE_NAME_encoded')
        if 'hour' in df.columns:
            feature_cols.append('hour')
        if 'day_of_week' in df.columns:
            feature_cols.append('day_of_week')
        if 'is_peak_hour' in df.columns:
            feature_cols.append('is_peak_hour')
        if 'DISTANCE_KM' in df.columns:
            feature_cols.append('DISTANCE_KM')
        if 'TOTAL_TRAVEL_MINUTES' in df.columns:
            feature_cols.append('TOTAL_TRAVEL_MINUTES')
            
        # Store feature columns
        if fit_encoders:
            self.feature_columns = feature_cols
            
        # Fill missing values
        for col in feature_cols:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median() if df[col].dtype in ['float64', 'int64'] else 0)
            else:
                df[col] = 0
                
        return df[feature_cols] if feature_cols else df
    
    def train(self, delay_data: pd.DataFrame) -> Dict:
        """Train the delay prediction model."""
        print("Training delay prediction model...")
        
        # Prepare features
        delay_data = delay_data.dropna(subset=['delay_minutes'])
        X = self.prepare_features(delay_data, fit_encoders=True)
        y = delay_data['delay_minutes'].values
        
        if len(X) < 100:
            print(f"Warning: Only {len(X)} samples available for training")
            return {'status': 'insufficient_data', 'samples': len(X)}
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train XGBoost model
        self.model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        
        print(f"✓ Delay model trained - R²: {r2:.3f}, RMSE: {rmse:.2f} minutes")
        
        return {
            'status': 'success',
            'r2_score': r2,
            'rmse': rmse,
            'samples': len(X),
            'features': self.feature_columns
        }
    
    def predict(self, route_id: str, hour: int = 12, day_of_week: int = 0, 
                distance_km: float = 50, travel_minutes: float = 60,
                service_type: str = 'EXPRESS') -> float:
        """Predict delay for given parameters."""
        if not self.is_trained:
            # Return mock prediction
            return np.random.uniform(0, 15)
        
        # Create input dataframe
        input_df = pd.DataFrame([{
            'ROUTE_ID': route_id,
            'SERVICE_TYPE_NAME': service_type,
            'hour': hour,
            'day_of_week': day_of_week,
            'is_peak_hour': 1 if (7 <= hour <= 10) or (17 <= hour <= 20) else 0,
            'DISTANCE_KM': distance_km,
            'TOTAL_TRAVEL_MINUTES': travel_minutes
        }])
        
        X = self.prepare_features(input_df, fit_encoders=False)
        prediction = self.model.predict(X)[0]
        
        return max(0, prediction)  # Ensure non-negative


class DemandForecastingModel:
    """Demand forecasting using XGBoost for time series."""
    
    def __init__(self):
        self.model = None
        self.label_encoders = {}
        self.feature_columns = []
        self.is_trained = False
        
    def prepare_features(self, df: pd.DataFrame, fit_encoders: bool = False) -> pd.DataFrame:
        """Prepare features for demand forecasting."""
        df = df.copy()
        
        # Encode route ID
        if 'ROUTE_ID' in df.columns:
            if fit_encoders or 'ROUTE_ID' not in self.label_encoders:
                self.label_encoders['ROUTE_ID'] = LabelEncoder()
                df['ROUTE_ID_encoded'] = self.label_encoders['ROUTE_ID'].fit_transform(df['ROUTE_ID'].astype(str))
            else:
                df['ROUTE_ID_encoded'] = df['ROUTE_ID'].astype(str).apply(
                    lambda x: self.label_encoders['ROUTE_ID'].transform([x])[0]
                    if x in self.label_encoders['ROUTE_ID'].classes_ else -1
                )
        
        # Select features
        feature_cols = []
        
        if 'ROUTE_ID_encoded' in df.columns:
            feature_cols.append('ROUTE_ID_encoded')
        if 'hour' in df.columns:
            feature_cols.append('hour')
        if 'day_of_week' in df.columns:
            feature_cols.append('day_of_week')
        if 'month' in df.columns:
            feature_cols.append('month')
        if 'is_peak_hour' in df.columns:
            feature_cols.append('is_peak_hour')
        if 'is_weekend' in df.columns:
            feature_cols.append('is_weekend')
            
        if fit_encoders:
            self.feature_columns = feature_cols
            
        # Fill missing values
        for col in feature_cols:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median() if df[col].dtype in ['float64', 'int64'] else 0)
            else:
                df[col] = 0
                
        return df[feature_cols] if feature_cols else df
    
    def train(self, demand_data: pd.DataFrame) -> Dict:
        """Train the demand forecasting model."""
        print("Training demand forecasting model...")
        
        # Prepare features
        demand_data = demand_data.dropna(subset=['passenger_count'])
        X = self.prepare_features(demand_data, fit_encoders=True)
        y = demand_data['passenger_count'].values
        
        if len(X) < 100:
            print(f"Warning: Only {len(X)} samples available for training")
            return {'status': 'insufficient_data', 'samples': len(X)}
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train model
        self.model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        r2 = r2_score(y_test, y_pred)
        mape = mean_absolute_percentage_error(y_test, y_pred) * 100
        
        print(f"✓ Demand model trained - R²: {r2:.3f}, MAPE: {mape:.2f}%")
        
        return {
            'status': 'success',
            'r2_score': r2,
            'mape': mape,
            'samples': len(X),
            'features': self.feature_columns
        }
    
    def predict(self, route_id: str, hour: int = 12, day_of_week: int = 0, month: int = 1) -> int:
        """Predict passenger demand."""
        if not self.is_trained:
            # Return mock prediction
            if (7 <= hour <= 10) or (17 <= hour <= 20):
                return np.random.randint(50, 100)
            return np.random.randint(10, 40)
        
        # Create input
        input_df = pd.DataFrame([{
            'ROUTE_ID': route_id,
            'hour': hour,
            'day_of_week': day_of_week,
            'month': month,
            'is_peak_hour': 1 if (7 <= hour <= 10) or (17 <= hour <= 20) else 0,
            'is_weekend': 1 if day_of_week in [5, 6] else 0
        }])
        
        X = self.prepare_features(input_df, fit_encoders=False)
        prediction = self.model.predict(X)[0]
        
        return max(0, int(prediction))


class AnomalyDetectionModel:
    """Isolation Forest for anomaly detection."""
    
    def __init__(self):
        self.model = None
        self.is_trained = False
        
    def train(self, bus_data: pd.DataFrame) -> Dict:
        """Train anomaly detection model."""
        print("Training anomaly detection model...")
        
        # Select features
        feature_cols = ['occupancy', 'delay_minutes', 'speed']
        available_cols = [col for col in feature_cols if col in bus_data.columns]
        
        if len(available_cols) < 2:
            print("Warning: Insufficient features for anomaly detection")
            return {'status': 'insufficient_features'}
        
        X = bus_data[available_cols].fillna(0)
        
        if len(X) < 50:
            print(f"Warning: Only {len(X)} samples for anomaly detection")
            return {'status': 'insufficient_data', 'samples': len(X)}
        
        # Train Isolation Forest
        self.model = IsolationForest(
            contamination=0.1,  # Expect 10% anomalies
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X)
        self.is_trained = True
        
        print(f"✓ Anomaly detection model trained on {len(X)} samples")
        
        return {
            'status': 'success',
            'samples': len(X),
            'features': available_cols
        }
    
    def detect(self, occupancy: float, delay: float, speed: float) -> bool:
        """Detect if given metrics are anomalous."""
        if not self.is_trained:
            # Rule-based fallback
            return occupancy > 95 or delay > 30 or speed < 5
        
        X = np.array([[occupancy, delay, speed]])
        prediction = self.model.predict(X)[0]
        
        return prediction == -1  # -1 indicates anomaly


# Global model instances
delay_model = DelayPredictionModel()
demand_model = DemandForecastingModel()
anomaly_model = AnomalyDetectionModel()


def save_models(model_dir: str = "backend/models/trained"):
    """Save trained models to disk."""
    os.makedirs(model_dir, exist_ok=True)
    
    if delay_model.is_trained:
        joblib.dump(delay_model, f"{model_dir}/delay_model.pkl")
        print(f"✓ Saved delay model to {model_dir}/delay_model.pkl")
        
    if demand_model.is_trained:
        joblib.dump(demand_model, f"{model_dir}/demand_model.pkl")
        print(f"✓ Saved demand model to {model_dir}/demand_model.pkl")
        
    if anomaly_model.is_trained:
        joblib.dump(anomaly_model, f"{model_dir}/anomaly_model.pkl")
        print(f"✓ Saved anomaly model to {model_dir}/anomaly_model.pkl")


def load_models(model_dir: str = "backend/models/trained"):
    """Load trained models from disk."""
    global delay_model, demand_model, anomaly_model
    
    delay_path = f"{model_dir}/delay_model.pkl"
    if os.path.exists(delay_path):
        delay_model = joblib.load(delay_path)
        print(f"✓ Loaded delay model from {delay_path}")
        
    demand_path = f"{model_dir}/demand_model.pkl"
    if os.path.exists(demand_path):
        demand_model = joblib.load(demand_path)
        print(f"✓ Loaded demand model from {demand_path}")
        
    anomaly_path = f"{model_dir}/anomaly_model.pkl"
    if os.path.exists(anomaly_path):
        anomaly_model = joblib.load(anomaly_path)
        print(f"✓ Loaded anomaly model from {anomaly_path}")
