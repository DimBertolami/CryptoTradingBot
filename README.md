update papertrader is currently accepting our new features!! 
![image](https://github.com/user-attachments/assets/ca48677e-f451-4b78-bf7c-e4de2eece6c4)



main dashboard:

![image](https://github.com/user-attachments/assets/96b15780-0cdb-4645-89be-3ca50c58e557)

![image](https://github.com/user-attachments/assets/516f579e-58c2-4c53-8581-492b223d2e29)

![image](https://github.com/user-attachments/assets/dd95704c-0cd6-45d1-b2e1-9bb4a29bf8e5)



under my assets: 

![image](https://github.com/user-attachments/assets/a31d2f4c-d66f-4c16-9b6c-3c26ab9aac69)

![image](https://github.com/user-attachments/assets/867bc31f-3641-4fac-8f0e-3f17bd73ad74)

![image](https://github.com/user-attachments/assets/8d453282-b00b-46b7-ae83-146e5230c592)

![image](https://github.com/user-attachments/assets/7ffc3642-9666-429e-bbd0-f54ac5370328)

trading strategy:
![image](https://github.com/user-attachments/assets/2e680d0e-f873-467a-8003-3bd7354270c1)

paper trading, which can easily be configured for realtime trading. 
Just add your api key and secret and the bot is ready to play with the big boys, and will give them a run for their money also. 

![image](https://github.com/user-attachments/assets/d2807478-c554-4dcf-8c62-ab45aaf5efa8)

![image](https://github.com/user-attachments/assets/118e790b-b6a1-4986-bcf6-10a5b431fd5a)

the internals section is where the bot is supposed to explain to me how it makes his decisions, and evaluates his own performance, so that he can make adjustments to his strategy. Still alot of work to do, but it's getting there
![image](https://github.com/user-attachments/assets/f27b7985-64bb-48b6-ae5d-83fbfa94d999)
![image](https://github.com/user-attachments/assets/9a768dfc-c860-4f48-89bc-f4302ebc670e)
![image](https://github.com/user-attachments/assets/c2422114-a17b-4d8a-ae36-ae709cab80c3)

and last screenshot i want to share is the dark mode 
![image](https://github.com/user-attachments/assets/09ddf29d-f483-46cb-adc8-d63f6acb4afd)

## Development Setup

1. Install system dependencies:
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip npm nodejs
```

2. Install Python dependencies:
```bash
pip3 install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd bot/frontend
npm install
```

4. Start the development environment:
```bash
cd bot
./startup.sh
```

The system will automatically:
- Start the backend API server
- Start the frontend development server
- Set up proper logging
- Manage process IDs
- Handle health checks and retries

## Testing

To run the test suite:
```bash
pip3 install pytest pytest-cov
python3 -m pytest tests/ -v --cov=bot
```

## Project Structure

```
binary/
├── bot/
│   ├── backend/          # Backend API and services
│   ├── frontend/         # React frontend application
│   ├── scripts/          # Utility scripts
│   └── tests/            # Test files
└── requirements.txt      # Python dependencies
