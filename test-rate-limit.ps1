Write-Host "Testing rate limiting - making 6 login attempts with wrong password..."
Write-Host ""

for ($i = 1; $i -le 6; $i++) {
    Write-Host "Attempt $i..."
    $body = @{userId="admin"; password="WrongPassword"} | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
        Write-Host "Status: $($response.StatusCode)"
        Write-Host "Response: $($response.Content)"
    } catch {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "Response: $($_.ErrorDetails.Message)"
    }
    
    Write-Host ""
    Start-Sleep -Milliseconds 500
}

Write-Host "Rate limiting test complete!"
