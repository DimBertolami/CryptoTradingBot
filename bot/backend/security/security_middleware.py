from fastapi import Request, Response, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
import jwt
from typing import Optional
from .security_config import security_config

class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request):
        credentials: Optional[HTTPAuthorizationCredentials] = await super(JWTBearer, self).__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme.")
            if not self.verify_jwt(credentials.credentials):
                raise HTTPException(status_code=403, detail="Invalid token or expired token.")
            return credentials.credentials
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")

    def verify_jwt(self, jwtoken: str) -> bool:
        try:
            api_config = security_config.get_api_config()
            payload = jwt.decode(
                jwtoken,
                api_config["jwt_secret"],
                algorithms=["HS256"]
            )
            return True
        except Exception as e:
            print(f"JWT verification failed: {str(e)}")
            return False

def create_jwt_token(data: dict) -> str:
    api_config = security_config.get_api_config()
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(seconds=api_config["token_expiration"])
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, api_config["jwt_secret"], algorithm="HS256")
    return encoded_jwt

def validate_api_key(api_key: str) -> bool:
    # In production, this would check against a secure database
    return api_key == os.getenv("API_KEY", "")

def rate_limit_middleware(request: Request, call_next):
    api_config = security_config.get_api_config()
    
    # Basic rate limiting implementation
    client_ip = request.client.host
    current_time = datetime.now()
    
    # In production, this would use a proper rate limiting system
    # Here we just demonstrate the concept
    return call_next(request)

def cors_middleware(request: Request, call_next):
    cors_config = security_config.get_cors_config()
    response = Response()
    
    if request.method == "OPTIONS":
        response.headers["Access-Control-Allow-Origin"] = ", ".join(cors_config["allowed_origins"])
        response.headers["Access-Control-Allow-Methods"] = ", ".join(cors_config["allowed_methods"])
        response.headers["Access-Control-Allow-Headers"] = ", ".join(cors_config["allowed_headers"])
        return response
    
    response = call_next(request)
    response.headers["Access-Control-Allow-Origin"] = ", ".join(cors_config["allowed_origins"])
    return response
