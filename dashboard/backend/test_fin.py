from logic import NetworkLogic
import os

# Point to root/output
BASE_DIR = os.path.join(os.getcwd(), "output")

print(f"Loading from {BASE_DIR}")
logic = NetworkLogic(BASE_DIR)
# Test Financials
res = logic.calculate_financials(250/1e6, 5000)
print(f"Financials: {res}")
