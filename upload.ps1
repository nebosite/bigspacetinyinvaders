$localFilePath = $PSScriptRoot + "\dist\"
$remotePath = "bigtinygames/bsti"
$serverName="home213002097.1and1-data.host"
$webclient = New-Object System.Net.WebClient
$webclient.Credentials = New-Object System.Net.NetworkCredential($env:FTPUSERNAME, $env:FTPPASSWORD)


$files = Get-ChildItem -r $localFilePath 

foreach ($file in $files) {
    if(Test-Path -Path $file.FullName -PathType Leaf)
    {       
        $relativePath = $file.FullName.Substring($localFilePath.Length); 
        $uri = New-Object System.Uri("ftp://$ServerName/$remotePath/$relativePath")  

        write-host $relativePath " to " $uri
        $webclient.UploadFile($uri, $file.FullName)
    }
}
