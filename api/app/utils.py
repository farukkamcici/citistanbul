from fastapi import HTTPException

def success_response(data, message = "ok", code = 200):
    return {
        "status": "success",
        "data": data,
        "message": message,
        "code": code
    }

def error_response(message = "error", code = 400):
    return {
        "status": "error",
        "code": code,
        "message": message,
        "data": None
    }

def parse_bbox(bbox: str):
    parts = bbox.split(',')
    if len(parts) != 4:
        raise HTTPException(status_code=400, detail="bbox must be 'minx,miny,maxx,maxy'")
    try:
        minx, miny, maxx, maxy = map(float, parts)
    except ValueError:
        raise HTTPException(status_code=400, detail="bbox values must be numbers")
    if not (minx < maxx and miny < maxy):
        raise HTTPException(status_code=400, detail="bbox must satisfy minx<maxx and miny<maxy")
    return minx, miny, maxx, maxy