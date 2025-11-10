# Dashboard API Testing Script
# Tests all 5 dashboard endpoints with real database data

$baseUrl = "http://localhost:4000"
$username = "admin"
$password = "Password123"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dashboard API Manual Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to get JWT token
Write-Host "Step 1: Logging in as '$username'..." -ForegroundColor Yellow
$loginBody = @{
    userId = $username
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "SUCCESS: Login successful!" -ForegroundColor Green
    
    # Extract token from response
    if ($loginResponse.token) {
        $token = $loginResponse.token
        Write-Host "  Token: $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "  Full Response: $($loginResponse | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
        Write-Host "FAILED: Could not extract token from response" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} catch {
    Write-Host "FAILED: Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Create authorization header
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Test GET /api/dashboard/metrics
Write-Host "Step 2: Testing GET /api/dashboard/metrics" -ForegroundColor Yellow
try {
    $startTime = Get-Date
    $metricsResponse = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/metrics" -Method Get -Headers $headers
    $endTime = Get-Date
    $responseTime = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "SUCCESS: Metrics endpoint successful! ($([math]::Round($responseTime, 2))ms)" -ForegroundColor Green
    Write-Host "  Response:" -ForegroundColor Gray
    Write-Host "  $($metricsResponse | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "FAILED: Metrics endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 3: Test GET /api/dashboard/collection-trends?months=6
Write-Host "Step 3: Testing GET /api/dashboard/collection-trends?months=6" -ForegroundColor Yellow
try {
    $startTime = Get-Date
    $trendsResponse = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/collection-trends?months=6" -Method Get -Headers $headers
    $endTime = Get-Date
    $responseTime = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "SUCCESS: Collection trends endpoint successful! ($([math]::Round($responseTime, 2))ms)" -ForegroundColor Green
    Write-Host "  Response:" -ForegroundColor Gray
    Write-Host "  $($trendsResponse | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "FAILED: Collection trends endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 4: Test GET /api/dashboard/branch-distribution?period=current_month
Write-Host "Step 4: Testing GET /api/dashboard/branch-distribution?period=current_month" -ForegroundColor Yellow
try {
    $startTime = Get-Date
    $branchResponse = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/branch-distribution?period=current_month" -Method Get -Headers $headers
    $endTime = Get-Date
    $responseTime = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "SUCCESS: Branch distribution endpoint successful! ($([math]::Round($responseTime, 2))ms)" -ForegroundColor Green
    Write-Host "  Response:" -ForegroundColor Gray
    Write-Host "  $($branchResponse | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "FAILED: Branch distribution endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 5: Test GET /api/dashboard/top-products
Write-Host "Step 5: Testing GET /api/dashboard/top-products" -ForegroundColor Yellow
try {
    $startTime = Get-Date
    $productsResponse = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/top-products" -Method Get -Headers $headers
    $endTime = Get-Date
    $responseTime = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "SUCCESS: Top products endpoint successful! ($([math]::Round($responseTime, 2))ms)" -ForegroundColor Green
    Write-Host "  Response:" -ForegroundColor Gray
    Write-Host "  $($productsResponse | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "FAILED: Top products endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 6: Test GET /api/dashboard/activities?limit=10
Write-Host "Step 6: Testing GET /api/dashboard/activities?limit=10" -ForegroundColor Yellow
try {
    $startTime = Get-Date
    $activitiesResponse = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/activities?limit=10" -Method Get -Headers $headers
    $endTime = Get-Date
    $responseTime = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "SUCCESS: Activities endpoint successful! ($([math]::Round($responseTime, 2))ms)" -ForegroundColor Green
    Write-Host "  Response:" -ForegroundColor Gray
    Write-Host "  $($activitiesResponse | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "FAILED: Activities endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
