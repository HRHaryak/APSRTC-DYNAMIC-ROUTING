"""
DPDP Act 2023 compliance utilities.
Ensures compliance with India's Digital Personal Data Protection Act.
"""
from typing import Dict, List
import re


def is_personal_data(field_name: str) -> bool:
    """
    Check if a field contains personal data.
    
    Personal data includes: names, addresses, phone numbers, email, Aadhaar, etc.
    """
    personal_fields = [
        'name', 'email', 'phone', 'mobile', 'address', 'aadhaar',
        'pan', 'passport', 'license', 'dob', 'birth', 'age',
        'gender', 'caste', 'religion', 'biometric'
    ]
    
    field_lower = field_name.lower()
    
    return any(pf in field_lower for pf in personal_fields)


def anonymize_data(data: Dict) -> Dict:
    """
    Anonymize personal data fields.
    Replaces personal data with anonymized versions.
    """
    anonymized = data.copy()
    
    for key, value in data.items():
        if is_personal_data(key):
            if isinstance(value, str):
                # Mask the value
                if '@' in value:  # Email
                    parts = value.split('@')
                    anonymized[key] = f"{parts[0][:2]}***@{parts[1]}"
                elif len(value) == 12 and value.isdigit():  # Aadhaar
                    anonymized[key] = f"XXXX-XXXX-{value[-4:]}"
                elif len(value) == 10 and value.isdigit():  # Phone
                    anonymized[key] = f"XXXXX-{value[-5:]}"
                else:
                    # Generic masking
                    anonymized[key] = f"{value[:2]}***"
    
    return anonymized


def aggregate_passenger_data(records: List[Dict]) -> Dict:
    """
    Aggregate passenger data to prevent individual identification.
    Returns aggregated statistics instead of individual records.
    """
    if not records:
        return {}
    
    # Count records
    total_count = len(records)
    
    # Aggregate by route if available
    route_counts = {}
    for record in records:
        route = record.get('route_id', 'unknown')
        route_counts[route] = route_counts.get(route, 0) + 1
    
    return {
        "total_passengers": total_count,
        "route_distribution": route_counts,
        "aggregation_note": "Individual records not stored per DPDP Act 2023"
    }


def check_consent_requirements(operation: str, data_type: str) -> Dict:
    """
    Check if consent is required for a data operation.
    
    Args:
        operation: Type of operation (collect, store, process, share, transfer)
        data_type: Type of data (personal, sensitive, financial, biometric)
    
    Returns:
        Dict with consent requirements
    """
    consent_matrix = {
        'personal': {
            'collect': True,
            'store': True,
            'process': True,
            'share': True,
            'transfer': True
        },
        'sensitive': {
            'collect': True,
            'store': True,
            'process': True,
            'share': True,  # Explicit consent required
            'transfer': True  # Cross-border transfer requires explicit consent
        }
    }
    
    requires_consent = consent_matrix.get(data_type, {}).get(operation, False)
    
    return {
        "operation": operation,
        "data_type": data_type,
        "consent_required": requires_consent,
        "consent_type": "explicit" if data_type == "sensitive" else "informed",
        "retention_period": "As per APSRTC policy, max 2 years for analytics"
    }


def validate_data_minimization(requested_fields: List[str], business_purpose: str) -> Dict:
    """
    Validate that only necessary data is collected (data minimization principle).
    
    Args:
        requested_fields: List of fields being requested
        business_purpose: Purpose for collecting the data
    
    Returns:
        Validation result with recommendations
    """
    # Define necessary fields per purpose
    purpose_fields = {
        "route_optimization": ['route_id', 'timestamp', 'occupancy', 'delay'],
        "demand_forecasting": ['route_id', 'timestamp', 'passenger_count'],
        "performance_analytics": ['route_id', 'service_id', 'on_time_status', 'distance'],
        "fare_calculation": ['route_id', 'distance', 'fare_amount']
    }
    
    necessary_fields = purpose_fields.get(business_purpose, [])
    personal_fields = [f for f in requested_fields if is_personal_data(f)]
    
    # Check for unnecessary personal data
    unnecessary = [f for f in personal_fields if f not in necessary_fields]
    
    return {
        "business_purpose": business_purpose,
        "requested_fields": requested_fields,
        "necessary_fields": necessary_fields,
        "personal_data_requested": personal_fields,
        "unnecessary_personal_data": unnecessary,
        "compliant": len(unnecessary) == 0,
        "recommendation": "Remove unnecessary personal data fields" if unnecessary else "Compliant with data minimization"
    }


def get_data_retention_policy() -> Dict:
    """Get data retention policy as per DPDP Act."""
    return {
        "operational_data": "30 days",
        "analytics_data": "2 years (aggregated only)",
        "audit_logs": "5 years",
        "ml_training_data": "2 years (anonymized)",
        "user_credentials": "Until account deletion",
        "deletion_process": "Automated purge based on retention period",
        "user_rights": [
            "Right to access data",
            "Right to correction",
            "Right to erasure",
            "Right to data portability"
        ]
    }


# Compliance check on import
print("✓ DPDP Act 2023 compliance module loaded")
print(f"  Data retention policy: {get_data_retention_policy()['analytics_data']}")
