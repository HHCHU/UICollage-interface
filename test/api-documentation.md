# API Documentation

## Overview
This API provides endpoints to:
- **/calculation**: Process 3 input images (base64) and return 9 output images.
- **/calculation-test**: Return 9 predefined output images.
- **/ping**: Check if the server is running.

## Endpoints

### GET /ping
**Description**: Checks if the server is running.  
**Response**:  
```json
{
  "message": "Server is up and running!"
}
```

### POST /calculation
**Description**: Takes three base64-encoded images, processes them, and returns a set of ranked images.
**Request Body**:
```json
{
  "images": ["<base64_image1>", "<base64_image2>", "<base64_image3>"]
}
```
**Response**:
```json
{
  "message": "Sequence Retrieved",
  "images": ["<base64_img_1>", "<base64_img_2>", "...", "<base64_img_9>"]
}
```
#### Error Cases:
- Missing or invalid images (400)
- Internal processing errors (500)
  
### POST /calculation-test
**Description**: Returns a predefined set of 9 base64-encoded images.
**Request Body**:
```json
{}
```
**Response**:
```json
{
  "message": "Predefined images retrieved",
  "images": ["<base64_img_1>", "<base64_img_2>", "...", "<base64_img_9>"]
}
```