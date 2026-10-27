param(
    [string]$BaseUrl = "http://localhost:5000"
)

$ErrorActionPreference = "Stop"
$script:session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Send-Json($Method, $Path, $Body = $null) {
    $request = @{
        Method = $Method
        Uri = "$BaseUrl$Path"
        WebSession = $script:session
        UseBasicParsing = $true
    }
    if ($null -ne $Body) {
        $request.ContentType = "application/json"
        $request.Body = ConvertTo-Json -InputObject $Body -Depth 10 -Compress
    }
    try {
        $response = Invoke-WebRequest @request
        return @{ Status = [int]$response.StatusCode; Content = $response.Content }
    } catch {
        $response = $_.Exception.Response
        if ($null -eq $response) { throw }
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $content = $reader.ReadToEnd()
        $reader.Dispose()
        return @{ Status = [int]$response.StatusCode; Content = $content }
    }
}

function Assert-Status($Response, $Expected, $Operation) {
    if ($Response.Status -ne $Expected) {
        throw "$Operation returned HTTP $($Response.Status), expected $Expected. $($Response.Content)"
    }
}

try {
    $health = Invoke-RestMethod "$BaseUrl/api/health" -WebSession $script:session
    if ($health.status -ne "ok" -or $health.database -ne "connected") {
        throw "API health check failed."
    }

    $login = Send-Json "POST" "/api/auth/login" @{ email = "priya@atomberg.com" }
    Assert-Status $login 200 "Demo login"
    $initial = Send-Json "GET" "/api/goals?employee_id=4"
    Assert-Status $initial 200 "List goals"

    $goalBody = @{
        thrustArea = "Innovation"
        title = "Smoke test goal"
        description = "Created by backend/smoke-test.ps1"
        uom = "Numeric (Higher is Better)"
        target = 20
        weightage = 10
    }
    $created = Send-Json "POST" "/api/goals?employee_id=4" $goalBody
    Assert-Status $created 201 "Create goal"
    $goal = $created.Content | ConvertFrom-Json
    if ($goal.status -ne "draft" -or $goal.employeeId -ne 4) {
        throw "Created goal response did not contain expected draft data."
    }

    $updated = Send-Json "PUT" "/api/goals/$($goal.id)" @{ title = "Updated smoke test goal"; target = 25 }
    Assert-Status $updated 200 "Update goal"
    if (($updated.Content | ConvertFrom-Json).title -ne "Updated smoke test goal") {
        throw "Goal update was not returned."
    }

    $progress = Send-Json "POST" "/api/goals/$($goal.id)/achievement" @{
        quarter = "Q1 (July)"
        actual = 12
        status = "On Track"
    }
    Assert-Status $progress 200 "Log achievement"
    if (($progress.Content | ConvertFrom-Json).achievements.'Q1 (July)'.actual -ne 12) {
        throw "Achievement was not persisted."
    }

    $invalid = Send-Json "POST" "/api/goals?employee_id=4" @{
        thrustArea = "Innovation"
        title = ""
        uom = "Invalid"
        target = -5
        weightage = 5
    }
    Assert-Status $invalid 400 "Reject invalid goal"
    if (-not (($invalid.Content | ConvertFrom-Json).errors)) {
        throw "Invalid-goal response did not include field errors."
    }

    $managerLogin = Send-Json "POST" "/api/auth/login" @{ email = "rajesh@atomberg.com" }
    Assert-Status $managerLogin 200 "Manager login"
    $approved = Send-Json "POST" "/api/goals/$($goal.id)/approve"
    Assert-Status $approved 200 "Approve goal"
    if (($approved.Content | ConvertFrom-Json).status -ne "approved") {
        throw "Manager approval was not persisted."
    }

    $checkin = Send-Json "POST" "/api/goals/$($goal.id)/checkin" @{
        quarter = "Q1 (July)"
        comment = "Manager smoke test check-in"
    }
    Assert-Status $checkin 200 "Save manager check-in"
    if (($checkin.Content | ConvertFrom-Json).checkins.'Q1 (July)'.comment -ne "Manager smoke test check-in") {
        throw "Manager check-in was not persisted."
    }

    $adminLogin = Send-Json "POST" "/api/auth/login" @{ email = "admin@atomberg.com" }
    Assert-Status $adminLogin 200 "Admin login"
    $unlocked = Send-Json "POST" "/api/goals/$($goal.id)/unlock"
    Assert-Status $unlocked 200 "Unlock goal"

    $deleted = Send-Json "DELETE" "/api/goals/$($goal.id)"
    Assert-Status $deleted 200 "Delete goal"
    $remaining = (Send-Json "GET" "/api/goals?employee_id=4").Content | ConvertFrom-Json
    if (@($remaining | Where-Object { $_.id -eq $goal.id }).Count -ne 0) {
        throw "Deleted goal remains in the database."
    }

    Write-Output "PASS: health, sign-in, goal CRUD, progress, manager approval/check-in, admin unlock, and invalid-input validation."
}
finally {
    $script:session = $null
}
