#!/bin/bash

echo "Installing required packages..."

# Update pip first
pip install --upgrade pip

# Install core dependencies
pip install ultralytics

# Install additional dependencies if needed
pip install opencv-python
pip install matplotlib
pip install pandas
pip install seaborn

echo "Installation complete!"
echo "You can now run: python3 train_simple.py"
