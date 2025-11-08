Write-Host "=== Frontend Integration Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Fetch user list
Write-Host "Test 1: Fetching user list from frontend origin..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:5173"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/users/list" -Method GET -Headers $headers
    
    Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "✓ CORS Headers:" -ForegroundColor Green
    
    # Check for CORS headers
    if ($response.Headers["Access-Control-Allow-Origin"]) {
        Write-Host "  - Access-Control-Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
    }
    if ($response.Headers["Access-Control-Allow-Credentials"]) {
        Write-Host "  - Access-Control-Allow-Credentials: $($response.Headers['Access-Control-Allow-Credentials'])" -ForegroundColor Green
    }
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Users fetched: $($data.users.Count)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Failed to fetch users" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Login from frontend
Write-Host "Test 2: Testing login from frontend origin..." -ForegroundColor Yellow

# Wait for rate limit to reset (if needed)
Write-Host "Waiting 2 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 2

try {
    $headers = @{
        "Origin" = "http://localhost:5173"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        userId = "mohamed.ibrahim"
        password = "Password123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" -Method POST -Headers $headers -Body $body
    
    Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "✓ CORS Headers:" -ForegroundColor Green
    
    # Check for CORS headers
    if ($response.Headers["Access-Control-Allow-Origin"]) {
        Write-Host "  - Access-Control-Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
    }
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Login successful for: $($data.user.fullName)" -ForegroundColor Green
    Write-Host "✓ JWT Token received: $($data.token.Substring(0, 50))..." -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: OPTIONS preflight request
Write-Host "Test 3: Testing CORS preflight (OPTIONS)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:5173"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type,Authorization"
    }
    
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" -Method OPTIONS -Headers $headers
    
    Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "✓ Preflight CORS Headers:" -ForegroundColor Green
    
    if ($response.Headers["Access-Control-Allow-Origin"]) {
        Write-Host "  - Access-Control-Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
    }
    if ($response.Headers["Access-Control-Allow-Methods"]) {
        Write-Host "  - Access-Control-Allow-Methods: $($response.Headers['Access-Control-Allow-Methods'])" -ForegroundColor Green
    }
    if ($response.Headers["Access-Control-Allow-Headers"]) {
        Write-Host "  - Access-Control-Allow-Headers: $($response.Headers['Access-Control-Allow-Headers'])" -ForegroundColor Green
    }
    Write-Host ""
} catch {
    Write-Host "✗ Preflight request failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "=== Frontend Integration Test Complete ===" -ForegroundColor Cyan
