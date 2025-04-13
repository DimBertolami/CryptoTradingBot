import subprocess
import time
import os
import sys

def run_command(command):
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    return stdout.decode(), stderr.decode()

def main():
    print("Starting endpoint tests...")
    
    # Get current directory
    current_dir = os.path.abspath(os.path.dirname(__file__))
    
    # Start Flask server
    print("\nStarting Flask server...")
    server_process = subprocess.Popen(['python3', 'app.py'], cwd=current_dir)
    
    # Wait for server to start
    print("Waiting for server to start...")
    time.sleep(2)
    
    try:
        # Run tests
        print("\nRunning status endpoint tests...")
        test_script = os.path.join(current_dir, 'test_status_endpoints.py')
        test_output, test_error = run_command(f'python3 {test_script}')
        
        if test_error:
            print(f"\nTest Error:\n{test_error}")
        print(f"\nTest Output:\n{test_output}")
        
    finally:
        # Stop the server
        print("\nStopping server...")
        server_process.terminate()
        server_process.wait()
    
    print("\nAll tests completed")

if __name__ == '__main__':
    main()