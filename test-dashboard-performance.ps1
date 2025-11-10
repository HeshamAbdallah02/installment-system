# Dashboard API Performance Testing Script
# Measures response times and validates performance targets

$baseUrl = "http://localhost:4000"
$username = "admin"
$password = "Password123"
$iterations = 5

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dashboard API Performance Testing" -ForegroundColor Cyan
Write-Host "Running $iterations iterations per endpoint" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Login to get JWT token
Write-Host "Logging in..." -ForegroundColor Yellow
$loginBody = @{
    userId = $username
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "SUCCESS: Authenticated" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "FAILED: Login failed" -ForegroundColor Red
    exit 1
}

# Create authorization header
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Function to test endpoint performance
function Test-EndpointPerformance {
    param(
        [string]$Name,
        [string]$Url,
        [int]$TargetMs,
        [hashtable]$Headers,
        [int]$Iterations
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "  Target: < ${TargetMs}ms" -ForegroundColor Gray
    
    $times = @()
    $success = 0
    $failed = 0
    
    for ($i = 1; $i -le $Iterations; $i++) {
        try {
            $startTime = Get-Date
            $response = Invoke-RestMethod -Uri $Url -Method Get -Headers $Headers
            $endTime = Get-Date
            $responseTime = ($endTime - $startTime).TotalMilliseconds
            $times += $responseTime
            $success++
            
            Write-Host "  Iteration $i : $([math]::Round($responseTime, 2))ms" -ForegroundColor Gray
        } catch {
            $failed++
            Write-Host "  Iteration $i : FAILED" -ForegroundColor Red
        }
        
        # Small delay between requests
        Start-Sleep -Milliseconds 100
    }
    
    if ($times.Count -gt 0) {
        $avgTime = ($times | Measure-Object -Average).Average
        $minTime = ($times | Measure-Object -Minimum).Minimum
        $maxTime = ($times | Measure-Object -Maximum).Maximum
        
        Write-Host ""
        Write-Host "  Results:" -ForegroundColor Cyan
        Write-Host "    Average: $([math]::Round($avgTime, 2))ms" -ForegroundColor White
        Write-Host "    Min: $([math]::Round($minTime, 2))ms" -ForegroundColor White
        Write-Host "    Max: $([math]::Round($maxTime, 2))ms" -ForegroundColor White
        Write-Host "    Success: $success/$Iterations" -ForegroundColor White
        
        if ($avgTime -lt $TargetMs) {
            Write-Host "  Status: PASS (under target)" -ForegroundColor Green
        } else {
            $diff = [math]::Round($avgTime - $TargetMs, 2)
            Write-Host "  Status: FAIL (over target by ${diff}ms)" -ForegroundColor Red
        }
    } else {
        Write-Host "  Status: FAIL (all requests failed)" -ForegroundColor Red
    }
    
    Write-Host ""
    
    return @{
        Name = $Name
        Target = $TargetMs
        Average = if ($times.Count -gt 0) { [math]::Round(($times | Measure-Object -Average).Average, 2) } else { 0 }
        Min = if ($times.Count -gt 0) { [math]::Round(($times | Measure-Object -Minimum).Minimum, 2) } else { 0 }
        Max = if ($times.Count -gt 0) { [math]::Round(($times | Measure-Object -Maximum).Maximum, 2) } else { 0 }
        Success = $success
        Failed = $failed
        Pass = if ($times.Count -gt 0) { ($times | Measure-Object -Average).Average -lt $TargetMs } else { $false }
    }
}

# Test all endpoints
$results = @()

$results += Test-EndpointPerformance `
    -Name "GET /api/dashboard/metrics" `
    -Url "$baseUrl/api/dashboard/metrics" `
    -TargetMs 500 `
    -Headers $headers `
    -Iterations $iterations

$results += Test-EndpointPerformance `
    -Name "GET /api/dashboard/collection-trends" `
    -Url "$baseUrl/api/dashboard/collection-trends?months=6" `
    -TargetMs 1000 `
    -Headers $headers `
    -Iterations $iterations

$results += Test-EndpointPerformance `
    -Name "GET /api/dashboard/branch-distribution" `
    -Url "$baseUrl/api/dashboard/branch-distribution?period=current_month" `
    -TargetMs 500 `
    -Headers $headers `
    -Iterations $iterations

$results += Test-EndpointPerformance `
    -Name "GET /api/dashboard/top-products" `
    -Url "$baseUrl/api/dashboard/top-products" `
    -TargetMs 500 `
    -Headers $headers `
    -Iterations $iterations

$results += Test-EndpointPerformance `
    -Name "GET /api/dashboard/activities" `
    -Url "$baseUrl/api/dashboard/activities?limit=10" `
    -TargetMs 300 `
    -Headers $headers `
    -Iterations $iterations

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Performance Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passCount = ($results | Where-Object { $_.Pass }).Count
$failCount = ($results | Where-Object { -not $_.Pass }).Count

Write-Host "Overall Results: $passCount passed, $failCount failed" -ForegroundColor White
Write-Host ""

# Detailed summary table
Write-Host "Endpoint Performance Summary:" -ForegroundColor Cyan
Write-Host ""
Write-Host ("{0,-45} {1,10} {2,10} {3,10} {4,10} {5,10}" -f "Endpoint", "Target", "Avg", "Min", "Max", "Status") -ForegroundColor White
Write-Host ("{0,-45} {1,10} {2,10} {3,10} {4,10} {5,10}" -f "-" * 45, "-" * 10, "-" * 10, "-" * 10, "-" * 10, "-" * 10) -ForegroundColor Gray

foreach ($result in $results) {
    $status = if ($result.Pass) { "PASS" } else { "FAIL" }
    $color = if ($result.Pass) { "Green" } else { "Red" }
    
    Write-Host ("{0,-45} {1,10} {2,10} {3,10} {4,10} " -f `
        $result.Name, `
        "$($result.Target)ms", `
        "$($result.Average)ms", `
        "$($result.Min)ms", `
        "$($result.Max)ms") -NoNewline
    Write-Host ("{0,10}" -f $status) -ForegroundColor $color
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Performance recommendations
if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "Performance Recommendations:" -ForegroundColor Yellow
    Write-Host "  1. Implement caching layer (5-10 minute TTL)" -ForegroundColor Gray
    Write-Host "  2. Verify database indexes are applied" -ForegroundColor Gray
    Write-Host "  3. Use Prisma select to fetch only required fields" -ForegroundColor Gray
    Write-Host "  4. Consider query optimization for slow endpoints" -ForegroundColor Gray
    Write-Host "  5. Test with larger dataset to validate performance" -ForegroundColor Gray
    Write-Host ""
}
