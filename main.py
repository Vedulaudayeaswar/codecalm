"""Root launcher for CodeCalm.

This keeps the old backend entrypoint intact while allowing `python main.py`
from the project root to start CodeCalm and the CodeTest dev services.
"""

import os
import runpy
import sys


ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(ROOT, "backend")

os.chdir(BACKEND)
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)
runpy.run_path(os.path.join(BACKEND, "main.py"), run_name="__main__")
