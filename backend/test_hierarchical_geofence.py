import sys
import os

# Add current directory to path so we can import database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import check_geofences

def run_tests():
    print("Testing Hierarchical Geofencing...")
    
    # Coordinates inside Wasserturm Area (Priority 20)
    # [8.475, 49.484]
    result = check_geofences(49.484, 8.475)
    print(f"Test 1 (Wasserturm Area): Expected 'area_wasserturm', Got '{result['id'] if result else 'None'}'")
    
    # Coordinates inside Quadrate but NOT Wasserturm (Priority 10)
    # [8.465, 49.485]
    result = check_geofences(49.485, 8.465)
    print(f"Test 2 (Quadrate District): Expected 'dist_quadrate', Got '{result['id'] if result else 'None'}'")

    # Coordinates outside all geofences
    result = check_geofences(50.000, 10.000)
    print(f"Test 3 (Outside): Expected 'None', Got '{result['id'] if result else 'None'}'")

if __name__ == "__main__":
    run_tests()
