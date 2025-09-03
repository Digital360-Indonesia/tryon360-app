# Question for Black Forest Labs AI Support

## Context
I'm building a virtual try-on application using FLUX Kontext Pro API. In the playground, I successfully achieved virtual try-on by uploading multiple images (model face + product garment). However, I cannot replicate this success via the API.

## Current Status
✅ **WORKING**: Model face recognition (100% accurate)
❌ **NOT WORKING**: Product garment recognition (completely ignored)

## What Works in Playground
- Upload multiple images (model face + product garment)
- Both images are used correctly
- Perfect virtual try-on results

## API Implementation Problem
The API seems to ONLY use the `input_image` parameter and ignores any second image for the garment.

## What We've Tried

### 1. Single `input_image` Parameter
```javascript
requestData.input_image = modelImageBase64;
```
**Result**: ✅ Model face works perfectly, but no way to include product

### 2. Array Format with `input_images`
```javascript
requestData.input_images = [modelImageBase64, productImageBase64];
```
**Result**: ❌ Completely ignored by API

### 3. Both Parameters Together
```javascript
requestData.input_image = modelImageBase64;
requestData.input_images = [modelImageBase64, productImageBase64];
```
**Result**: ✅ Model face works (from input_image), ❌ Product ignored (input_images not used)

### 4. Concatenated Base64 with Comma
```javascript
requestData.input_image = `data:image/jpeg;base64,${modelBase64},${productBase64}`;
```
**Result**: ❌ Error: "An error occurred while preparing the task" (too large ~7MB)

### 5. Undocumented Parameters
```javascript
requestData.reference_image = productImageBase64;
requestData.control_image = productImageBase64;
```
**Result**: ❌ Completely ignored

### 6. Different Array Orders
```javascript
requestData.input_images = [productImageBase64, modelImageBase64]; // Swapped
```
**Result**: ❌ Still ignored

## Prompt Variations Tried
1. "Using the exact face from image 1... Wearing garment from image 2..."
2. "Person from image 1 wearing clothing from image 2..."
3. Direct references without image numbers
4. All variations work for face but garment is never used

## Technical Details
- Endpoint: `https://api.bfl.ai/v1/flux-kontext-pro`
- Authentication: X-Key header (working)
- Image format: Base64 with data URL prefix
- Response: Successful generation but only uses first image

## Critical Questions

1. **How do I send multiple images to FLUX Kontext Pro API for virtual try-on?**
   - The playground clearly supports multiple images
   - What is the correct parameter/format for multiple images via API?

2. **Is there a specific parameter for the garment/product image?**
   - `input_image` works for the face
   - What parameter should contain the garment?

3. **Is the concatenated format correct? If so, what's the proper syntax?**
   - Should it be: `base64,base64`?
   - Or with data URLs: `data:image/jpeg;base64,xxx,data:image/jpeg;base64,yyy`?
   - Or some other format?

4. **Are there undocumented parameters for virtual try-on?**
   - Like `garment_image`, `product_image`, `reference_image`, etc.?

5. **Is there a different endpoint or model variant for multi-image virtual try-on?**
   - Maybe `flux-kontext-pro-multi` or similar?

## Example Use Case
I need to:
1. Use Paul's face (model reference photo)
2. Apply a specific green garment (uploaded product photo)
3. Generate an image with Paul wearing that exact garment

Currently getting: Paul's face ✅ but random clothing ❌

## Request for Help
Please provide the exact API format/parameters to replicate the playground's multi-image virtual try-on functionality. The playground clearly works with multiple images - how do we achieve this via API?