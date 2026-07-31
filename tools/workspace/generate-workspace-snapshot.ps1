<#
TMS-OS Workspace Snapshot Generator
Module: WMS Module 007
Version: 2.2.1
Operating Mode: Read-Only Workspace Capture
Module 010 Phase: Dynamic Versioned Snapshot Creation
#>

[CmdletBinding()]
param(
    [string]$WorkspaceRoot = "C:\Two Marshalls Studios",
    [string]$RepositoryPath = "C:\Two Marshalls Studios\studio-portal",
    [string]$SnapshotFoundationPath = "C:\Two Marshalls Studios\studio-portal\governance\workspace\snapshots\WORKSPACE-SNAPSHOT-001.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptName = "TMS-OS Workspace Snapshot Generator"
$ScriptVersion = "2.2.1"

$SnapshotDirectory = "C:\Two Marshalls Studios\studio-portal\governance\workspace\snapshots"
$SnapshotFilePattern = "WORKSPACE-SNAPSHOT-*.json"
$SnapshotNamePattern = "^WORKSPACE-SNAPSHOT-(\d{3})\.json$"

$FoundationDocumentId = "WORKSPACE-SNAPSHOT-001"
$ExpectedSnapshotType = "Workspace Snapshot"

$nextSnapshotIdentity = $null
$ExpectedDocumentId = $null
$SnapshotOutputPath = $null

function Write-Section {
    param([Parameter(Mandatory = $true)][string]$Title)
    Write-Host ""
    Write-Host "============================================================"
    Write-Host $Title
    Write-Host "============================================================"
}

function Get-NormalizedFullPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        throw "A path value is required."
    }

    return ([System.IO.Path]::GetFullPath($Path)).TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )
}

function Test-PathIsInside {
    param(
        [Parameter(Mandatory = $true)][string]$ParentPath,
        [Parameter(Mandatory = $true)][string]$ChildPath
    )

    $parent = Get-NormalizedFullPath -Path $ParentPath
    $child = [System.IO.Path]::GetFullPath($ChildPath)

    if ($child.Equals($parent, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $true
    }

    return $child.StartsWith(
        $parent + [System.IO.Path]::DirectorySeparatorChar,
        [System.StringComparison]::OrdinalIgnoreCase
    )
}

function Get-RelativeWorkspacePath {
    param(
        [Parameter(Mandatory = $true)][string]$RootPath,
        [Parameter(Mandatory = $true)][string]$ItemPath
    )

    $root = Get-NormalizedFullPath -Path $RootPath
    $item = [System.IO.Path]::GetFullPath($ItemPath)

    if ($item.Equals($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        return "."
    }

    $prefix = $root + [System.IO.Path]::DirectorySeparatorChar

    if ($item.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $item.Substring($prefix.Length)
    }

    return $item
}

function Convert-ToIsoUtc {
    param(
        [Parameter(Mandatory = $false)]
        [AllowNull()]
        [object]$DateValue
    )

    if ($null -eq $DateValue) {
        return $null
    }

    try {
        return ([datetime]$DateValue).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    catch {
        return $null
    }
}

function Test-RequiredPath {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Description,
        [Parameter(Mandatory = $true)][ValidateSet("Container", "Leaf")][string]$PathType
    )

    if (-not (Test-Path -LiteralPath $Path -PathType $PathType)) {
        throw "$Description was not found: $Path"
    }
}

function Get-NextSnapshotIdentity {
    param(
        [Parameter(Mandatory = $true)][string]$DirectoryPath,
        [Parameter(Mandatory = $true)][string]$FilePattern,
        [Parameter(Mandatory = $true)][string]$NamePattern
    )

    Test-RequiredPath `
        -Path $DirectoryPath `
        -Description "Approved snapshot directory" `
        -PathType "Container"

    $snapshotFiles = @(
        Get-ChildItem `
            -LiteralPath $DirectoryPath `
            -Filter $FilePattern `
            -File `
            -ErrorAction Stop
    )

    $recognizedSnapshots = New-Object System.Collections.Generic.List[object]
    $unrecognizedFiles = New-Object System.Collections.Generic.List[object]

    foreach ($snapshotFile in $snapshotFiles) {
        $match = [regex]::Match(
            $snapshotFile.Name,
            $NamePattern,
            [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
        )

        if (-not $match.Success) {
            [void]$unrecognizedFiles.Add(
                [ordered]@{
                    name = $snapshotFile.Name
                    fullPath = $snapshotFile.FullName
                    reason = "Filename did not match the governed snapshot naming pattern."
                }
            )
            continue
        }

        $snapshotNumber = [int]$match.Groups[1].Value

        [void]$recognizedSnapshots.Add(
            [ordered]@{
                snapshotNumber = $snapshotNumber
                documentId = ("WORKSPACE-SNAPSHOT-{0:D3}" -f $snapshotNumber)
                fileName = $snapshotFile.Name
                fullPath = $snapshotFile.FullName
            }
        )
    }

    $highestSnapshotNumber = 0

    if ($recognizedSnapshots.Count -gt 0) {
        foreach ($recognizedSnapshot in $recognizedSnapshots) {
            $recognizedSnapshotNumber = [int]$recognizedSnapshot["snapshotNumber"]

            if ($recognizedSnapshotNumber -gt $highestSnapshotNumber) {
                $highestSnapshotNumber = $recognizedSnapshotNumber
            }
        }
    }

    $nextSnapshotNumber = [int]($highestSnapshotNumber + 1)
    $nextDocumentId = "WORKSPACE-SNAPSHOT-{0:D3}" -f $nextSnapshotNumber
    $nextFileName = "$nextDocumentId.json"
    $nextOutputPath = Join-Path -Path $DirectoryPath -ChildPath $nextFileName

    return [ordered]@{
        discoveryAccepted = $true
        snapshotDirectory = [System.IO.Path]::GetFullPath($DirectoryPath)
        recognizedSnapshotCount = [int]$recognizedSnapshots.Count
        unrecognizedFileCount = [int]$unrecognizedFiles.Count
        highestSnapshotNumber = $highestSnapshotNumber
        nextSnapshotNumber = $nextSnapshotNumber
        nextDocumentId = $nextDocumentId
        nextFileName = $nextFileName
        nextOutputPath = [System.IO.Path]::GetFullPath($nextOutputPath)
        existingSnapshots = @(
            $recognizedSnapshots |
                Sort-Object -Property snapshotNumber
        )
        unrecognizedFiles = @(
            $unrecognizedFiles |
                Sort-Object -Property name
        )
    }
}

function Write-Utf8JsonFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Json
    )

    if ([string]::IsNullOrWhiteSpace($Json)) {
        throw "JSON content cannot be empty."
    }

    $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Json, $utf8WithoutBom)
}

function Add-ScanWarning {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [System.Collections.Generic.List[object]]$WarningCollection,

        [Parameter(Mandatory = $true)][string]$Message,
        [Parameter(Mandatory = $true)][string]$Category,

        [Parameter(Mandatory = $false)]
        [AllowNull()]
        [AllowEmptyString()]
        [string]$Target
    )

    [void]$WarningCollection.Add(
        [ordered]@{
            message = $Message
            category = $Category
            target = $Target
        }
    )
}

function Test-IsHiddenItem {
    param([Parameter(Mandatory = $true)][System.IO.FileSystemInfo]$Item)

    return [bool](
        $Item.Attributes -band [System.IO.FileAttributes]::Hidden
    )
}

function Test-IsReparsePoint {
    param([Parameter(Mandatory = $true)][System.IO.FileSystemInfo]$Item)

    return [bool](
        $Item.Attributes -band [System.IO.FileAttributes]::ReparsePoint
    )
}

function New-FolderRecord {
    param(
        [Parameter(Mandatory = $true)][System.IO.DirectoryInfo]$Folder,
        [Parameter(Mandatory = $true)][string]$RootPath
    )

    $fullPath = [System.IO.Path]::GetFullPath($Folder.FullName)
    $parentPath = $null

    if ($null -ne $Folder.Parent) {
        $parentPath = $Folder.Parent.FullName
    }

    return [ordered]@{
        name = $Folder.Name
        relativePath = Get-RelativeWorkspacePath -RootPath $RootPath -ItemPath $fullPath
        fullPath = $fullPath
        parentPath = $parentPath
        attributes = $Folder.Attributes.ToString()
        isHidden = Test-IsHiddenItem -Item $Folder
        isReparsePoint = Test-IsReparsePoint -Item $Folder
        createdAt = Convert-ToIsoUtc -DateValue $Folder.CreationTime
        modifiedAt = Convert-ToIsoUtc -DateValue $Folder.LastWriteTime
        accessedAt = Convert-ToIsoUtc -DateValue $Folder.LastAccessTime
    }
}

function New-FileRecord {
    param(
        [Parameter(Mandatory = $true)][System.IO.FileInfo]$File,
        [Parameter(Mandatory = $true)][string]$RootPath
    )

    $fullPath = [System.IO.Path]::GetFullPath($File.FullName)
    $extension = $null

    if (-not [string]::IsNullOrWhiteSpace($File.Extension)) {
        $extension = $File.Extension.ToLowerInvariant()
    }

    return [ordered]@{
        name = $File.Name
        extension = $extension
        relativePath = Get-RelativeWorkspacePath -RootPath $RootPath -ItemPath $fullPath
        fullPath = $fullPath
        directoryPath = $File.DirectoryName
        sizeBytes = [long]$File.Length
        attributes = $File.Attributes.ToString()
        isHidden = Test-IsHiddenItem -Item $File
        isReadOnly = [bool]$File.IsReadOnly
        isReparsePoint = Test-IsReparsePoint -Item $File
        createdAt = Convert-ToIsoUtc -DateValue $File.CreationTime
        modifiedAt = Convert-ToIsoUtc -DateValue $File.LastWriteTime
        accessedAt = Convert-ToIsoUtc -DateValue $File.LastAccessTime
    }
}

Write-Section -Title "TMS-OS Workspace Snapshot Generator"

Write-Section -Title "Discovering Next Governed Snapshot Identity"

$nextSnapshotIdentity = Get-NextSnapshotIdentity `
    -DirectoryPath $SnapshotDirectory `
    -FilePattern $SnapshotFilePattern `
    -NamePattern $SnapshotNamePattern

$ExpectedDocumentId = [string]$nextSnapshotIdentity.nextDocumentId
$SnapshotOutputPath = [string]$nextSnapshotIdentity.nextOutputPath

if (Test-Path -LiteralPath $SnapshotOutputPath) {
    throw "The next governed snapshot output already exists and will not be overwritten: $SnapshotOutputPath"
}

Write-Host "Recognized snapshots : $($nextSnapshotIdentity.recognizedSnapshotCount)"
Write-Host "Highest snapshot     : $($nextSnapshotIdentity.highestSnapshotNumber)"
Write-Host "Next snapshot number : $($nextSnapshotIdentity.nextSnapshotNumber)"
Write-Host "Next document ID     : $ExpectedDocumentId"
Write-Host "Next file name       : $($nextSnapshotIdentity.nextFileName)"
Write-Host "Next output path     : $SnapshotOutputPath"
Write-Host "Discovery accepted   : $($nextSnapshotIdentity.discoveryAccepted)"

Write-Section -Title "Dynamic Versioned Snapshot Generator"

Write-Host "Generator version    : $ScriptVersion"
Write-Host "Operating mode       : Read-only workspace capture"
Write-Host "Workspace root       : $WorkspaceRoot"
Write-Host "Repository path      : $RepositoryPath"
Write-Host "Foundation snapshot  : $SnapshotFoundationPath"
Write-Host "Versioned output     : $SnapshotOutputPath"

Write-Section -Title "Validating Approved Paths"

Test-RequiredPath -Path $WorkspaceRoot -Description "Approved workspace root" -PathType "Container"
Test-RequiredPath -Path $RepositoryPath -Description "Approved repository" -PathType "Container"

$snapshotDirectory = Split-Path -Path $SnapshotOutputPath -Parent
Test-RequiredPath -Path $snapshotDirectory -Description "Approved snapshot directory" -PathType "Container"
Test-RequiredPath -Path $SnapshotFoundationPath -Description "Governed snapshot foundation document" -PathType "Leaf"

$normalizedWorkspaceRoot = Get-NormalizedFullPath -Path $WorkspaceRoot
$normalizedRepositoryPath = Get-NormalizedFullPath -Path $RepositoryPath
$normalizedSnapshotDirectory = Get-NormalizedFullPath -Path $snapshotDirectory
$normalizedSnapshotFoundationPath = [System.IO.Path]::GetFullPath($SnapshotFoundationPath)
$normalizedSnapshotOutputPath = [System.IO.Path]::GetFullPath($SnapshotOutputPath)

if (-not (Test-PathIsInside -ParentPath $normalizedWorkspaceRoot -ChildPath $normalizedRepositoryPath)) {
    throw "The approved repository must be located inside the approved workspace root."
}

if (-not (Test-PathIsInside -ParentPath $normalizedRepositoryPath -ChildPath $normalizedSnapshotFoundationPath)) {
    throw "The governed snapshot foundation must be located inside the approved repository."
}

if (-not (Test-PathIsInside -ParentPath $normalizedRepositoryPath -ChildPath $normalizedSnapshotOutputPath)) {
    throw "The snapshot output file must be located inside the approved repository."
}

if (-not (Test-PathIsInside -ParentPath $normalizedSnapshotDirectory -ChildPath $normalizedSnapshotOutputPath)) {
    throw "The snapshot output file must be located inside the approved snapshot directory."
}

Write-Host "Workspace path validation passed."
Write-Host "Repository path validation passed."
Write-Host "Foundation path validation passed."
Write-Host "Snapshot output validation passed."

Write-Section -Title "Reading Governed Snapshot Foundation"

try {
    $snapshotFoundation = Get-Content -LiteralPath $normalizedSnapshotFoundationPath -Raw -Encoding UTF8 | ConvertFrom-Json
}
catch {
    throw "The governed snapshot foundation could not be read. $($_.Exception.Message)"
}

if ($null -eq $snapshotFoundation) {
    throw "The governed snapshot foundation document returned no data."
}

if ($snapshotFoundation.documentId -ne $FoundationDocumentId) {
    throw "Snapshot foundation documentId must be $FoundationDocumentId."
}

if ($snapshotFoundation.snapshotType -ne $ExpectedSnapshotType) {
    throw "Snapshot snapshotType must be $ExpectedSnapshotType."
}

Write-Host "Governed snapshot foundation accepted."
Write-Host "Document ID        : $($snapshotFoundation.documentId)"
Write-Host "Snapshot type      : $($snapshotFoundation.snapshotType)"

Write-Section -Title "Scanning Approved Workspace"

$capturedFolders = New-Object System.Collections.Generic.List[object]
$capturedFiles = New-Object System.Collections.Generic.List[object]
$scanWarnings = New-Object System.Collections.Generic.List[object]
$excludedItems = New-Object System.Collections.Generic.List[object]

$scanErrors = @()
$allItems = @()

try {
    $allItems = @(
        Get-ChildItem `
            -LiteralPath $normalizedWorkspaceRoot `
            -Force `
            -Recurse `
            -ErrorAction SilentlyContinue `
            -ErrorVariable scanErrors
    )
}
catch {
    throw "Workspace enumeration failed. $($_.Exception.Message)"
}

foreach ($scanError in @($scanErrors)) {
    $message = "Unknown workspace enumeration warning."
    $category = "WorkspaceEnumerationWarning"
    $target = $null

    if ($null -ne $scanError.Exception) {
        $message = $scanError.Exception.Message
    }

    if ($null -ne $scanError.CategoryInfo) {
        $category = $scanError.CategoryInfo.Category.ToString()
    }

    if ($null -ne $scanError.TargetObject) {
        $target = $scanError.TargetObject.ToString()
    }

    Add-ScanWarning `
        -WarningCollection $scanWarnings `
        -Message $message `
        -Category $category `
        -Target $target
}

foreach ($item in $allItems) {
    $itemPath = $null

    try {
        if ($null -eq $item) {
            throw "Enumerated workspace item was null."
        }

        $itemPath = [System.IO.Path]::GetFullPath($item.FullName)

        $itemIsGovernedSnapshot = $false

        if (-not $item.PSIsContainer) {
            $itemDirectory = Get-NormalizedFullPath -Path $item.DirectoryName
            $itemNameMatch = [regex]::IsMatch(
                $item.Name,
                $SnapshotNamePattern,
                [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
            )

            $itemIsGovernedSnapshot = [bool](
                $itemDirectory.Equals(
                    $normalizedSnapshotDirectory,
                    [System.StringComparison]::OrdinalIgnoreCase
                ) -and $itemNameMatch
            )
        }

        if ($itemIsGovernedSnapshot) {
            [void]$excludedItems.Add(
                [ordered]@{
                    fullPath = $itemPath
                    reason = "Governed snapshot document excluded to prevent snapshot self-capture."
                }
            )
            continue
        }

        if ($item.PSIsContainer) {
            [void]$capturedFolders.Add(
                (New-FolderRecord -Folder ([System.IO.DirectoryInfo]$item) -RootPath $normalizedWorkspaceRoot)
            )
        }
        else {
            [void]$capturedFiles.Add(
                (New-FileRecord -File ([System.IO.FileInfo]$item) -RootPath $normalizedWorkspaceRoot)
            )
        }
    }
    catch {
        Add-ScanWarning `
            -WarningCollection $scanWarnings `
            -Message $_.Exception.Message `
            -Category "ItemCaptureFailure" `
            -Target $itemPath
    }
}

$sortedFolders = @($capturedFolders | Sort-Object -Property relativePath)
$sortedFiles = @($capturedFiles | Sort-Object -Property relativePath)
$sortedWarnings = @($scanWarnings | Sort-Object -Property target, category, message)
$sortedExcludedItems = @($excludedItems | Sort-Object -Property fullPath)

$folderCount = [int]$sortedFolders.Count
$fileCount = [int]$sortedFiles.Count
$totalItemCount = [int]($folderCount + $fileCount)
$totalFileSizeBytes = [long]0

foreach ($fileRecord in $sortedFiles) {
    $totalFileSizeBytes += [long]$fileRecord.sizeBytes
}

if ($allItems.Count -gt 0 -and $totalItemCount -eq 0) {
    throw "Workspace enumeration returned items, but no files or folders were captured."
}

Write-Host "Folders captured : $folderCount"
Write-Host "Files captured   : $fileCount"
Write-Host "Total items      : $totalItemCount"
Write-Host "Warnings         : $($sortedWarnings.Count)"
Write-Host "Excluded items   : $($sortedExcludedItems.Count)"

Write-Section -Title "Building Governed Snapshot"

$snapshotNumber = [int]$nextSnapshotIdentity.nextSnapshotNumber

if ($snapshotNumber -lt 1) {
    throw "The discovered snapshot number must be greater than zero."
}

$snapshotVersion = "1.0.0"
if ($null -ne $snapshotFoundation.version -and -not [string]::IsNullOrWhiteSpace([string]$snapshotFoundation.version)) {
    $snapshotVersion = [string]$snapshotFoundation.version
}

$governedSnapshot = [ordered]@{
    documentId = $ExpectedDocumentId
    version = $snapshotVersion
    status = "Captured"
    snapshotType = $ExpectedSnapshotType
    snapshotNumber = $snapshotNumber
    previousSnapshotNumber = [int]$nextSnapshotIdentity.highestSnapshotNumber
    previousDocumentId = if ([int]$nextSnapshotIdentity.highestSnapshotNumber -gt 0) {
        "WORKSPACE-SNAPSHOT-{0:D3}" -f [int]$nextSnapshotIdentity.highestSnapshotNumber
    }
    else {
        $null
    }
    generatedAt = [datetime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    generatedBy = $ScriptName

    generator = [ordered]@{
        name = $ScriptName
        version = $ScriptVersion
        operatingMode = "Read-Only Workspace Capture"
    }

    workspace = [ordered]@{
        rootPath = $normalizedWorkspaceRoot
        repositoryPath = $normalizedRepositoryPath
    }

    capture = [ordered]@{
        captureMethod = "PowerShell Recursive File-System Enumeration"
        operatingSystem = [System.Environment]::OSVersion.VersionString
        computerName = $env:COMPUTERNAME
        userName = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
        includeHiddenItems = $true
        recursive = $true
        workspaceModificationAllowed = $false
        snapshotOutputExcluded = $true
    }

    summary = [ordered]@{
        folderCount = $folderCount
        fileCount = $fileCount
        totalItemCount = $totalItemCount
        totalFileSizeBytes = $totalFileSizeBytes
        warningCount = [int]$sortedWarnings.Count
        excludedItemCount = [int]$sortedExcludedItems.Count
    }

    folders = $sortedFolders
    files = $sortedFiles
    excludedItems = $sortedExcludedItems
    warnings = $sortedWarnings

    validation = [ordered]@{
        validated = $true
        accepted = $true
        folderCountMatches = [bool]($folderCount -eq $sortedFolders.Count)
        fileCountMatches = [bool]($fileCount -eq $sortedFiles.Count)
        nonEmptyCapture = [bool]($totalItemCount -gt 0)
    }
}

$json = $governedSnapshot | ConvertTo-Json -Depth 12

Write-Section -Title "Writing Governed Snapshot"

Write-Utf8JsonFile -Path $normalizedSnapshotOutputPath -Json $json

try {
    $writtenSnapshot = Get-Content -LiteralPath $normalizedSnapshotOutputPath -Raw -Encoding UTF8 | ConvertFrom-Json
}
catch {
    throw "The written snapshot could not be verified. $($_.Exception.Message)"
}

if ($writtenSnapshot.documentId -ne $ExpectedDocumentId) {
    throw "Written snapshot verification failed. Unexpected documentId."
}

if ([int]$writtenSnapshot.snapshotNumber -ne $snapshotNumber) {
    throw "Written snapshot verification failed. Unexpected snapshotNumber."
}

if ($writtenSnapshot.snapshotType -ne $ExpectedSnapshotType) {
    throw "Written snapshot verification failed. Unexpected snapshotType."
}

if ([int]$writtenSnapshot.summary.folderCount -ne $folderCount) {
    throw "Written snapshot verification failed. Folder count does not match."
}

if ([int]$writtenSnapshot.summary.fileCount -ne $fileCount) {
    throw "Written snapshot verification failed. File count does not match."
}

if ([int]$writtenSnapshot.summary.totalItemCount -ne $totalItemCount) {
    throw "Written snapshot verification failed. Total item count does not match."
}

if (-not [bool]$writtenSnapshot.validation.accepted) {
    throw "Written snapshot verification failed. Validation was not accepted."
}

if (-not [bool]$writtenSnapshot.validation.nonEmptyCapture) {
    throw "Written snapshot verification failed. Capture was empty."
}

Write-Host "Snapshot successfully written and verified:"
Write-Host $normalizedSnapshotOutputPath

Write-Section -Title "Snapshot Generation Complete"

Write-Host "Document ID       : $ExpectedDocumentId"
Write-Host "Snapshot number   : $snapshotNumber"
Write-Host "Output file       : $normalizedSnapshotOutputPath"
Write-Host "Generator version : $ScriptVersion"
Write-Host "Folders captured  : $folderCount"
Write-Host "Files captured    : $fileCount"
Write-Host "Total items       : $totalItemCount"
Write-Host "Warnings recorded : $($sortedWarnings.Count)"
Write-Host "Excluded items    : $($sortedExcludedItems.Count)"
Write-Host "Workspace changed : No"
Write-Host "Snapshot written  : Yes"
Write-Host "Verification      : Passed"
Write-Host ""
