$ErrorActionPreference = 'Stop'

try {
    Write-Host "Connecting to localhost (master)..."
    $connString = "Server=localhost,1433;Database=master;Integrated Security=True;TrustServerCertificate=True;"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connString)
    $conn.Open()

    $cmd = $conn.CreateCommand()
    
    # 1. Enable Mixed Mode Authentication
    $cmd.CommandText = "EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', N'Software\Microsoft\MSSQLServer\MSSQLServer', N'LoginMode', REG_DWORD, 2;"
    $cmd.ExecuteNonQuery() | Out-Null
    Write-Host "Mixed mode authentication enabled."

    # 2. Create Database
    $cmd.CommandText = "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'itapplicationsupport') BEGIN CREATE DATABASE [itapplicationsupport]; END"
    $cmd.ExecuteNonQuery() | Out-Null
    Write-Host "Database created."

    # 3. Create Login
    $cmd.CommandText = "IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'app_support_user') BEGIN CREATE LOGIN [app_support_user] WITH PASSWORD=N'PasswordKuatIT123!', DEFAULT_DATABASE=[itapplicationsupport], CHECK_EXPIRATION=OFF, CHECK_POLICY=OFF; END ELSE BEGIN ALTER LOGIN [app_support_user] WITH PASSWORD=N'PasswordKuatIT123!'; END; ALTER LOGIN [app_support_user] ENABLE;"
    $cmd.ExecuteNonQuery() | Out-Null
    Write-Host "Login created/updated."

    $conn.Close()

    # 4. Map user to database
    Write-Host "Connecting to localhost (itapplicationsupport)..."
    $connStringDB = "Server=localhost,1433;Database=itapplicationsupport;Integrated Security=True;TrustServerCertificate=True;"
    $connDB = New-Object System.Data.SqlClient.SqlConnection($connStringDB)
    $connDB.Open()
    
    $cmdDB = $connDB.CreateCommand()
    $cmdDB.CommandText = "IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'app_support_user') BEGIN CREATE USER [app_support_user] FOR LOGIN [app_support_user]; END; ALTER ROLE [db_datareader] ADD MEMBER [app_support_user]; ALTER ROLE [db_datawriter] ADD MEMBER [app_support_user];"
    $cmdDB.ExecuteNonQuery() | Out-Null
    Write-Host "User mapped to database with Read/Write access."

    # Create Tables
    $cmdDB.CommandText = "IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='daily_tasks' and xtype='U') BEGIN CREATE TABLE daily_tasks (id INT IDENTITY(1,1) PRIMARY KEY, task_name NVARCHAR(255) NOT NULL, stage NVARCHAR(100), priority NVARCHAR(50), pic NVARCHAR(100), start_date NVARCHAR(50), created_at DATETIME DEFAULT GETDATE()); END;"
    $cmdDB.ExecuteNonQuery() | Out-Null
    
    $cmdDB.CommandText = "IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='pic_it' and xtype='U') BEGIN CREATE TABLE pic_it (id INT IDENTITY(1,1) PRIMARY KEY, pic_name NVARCHAR(100) NOT NULL, system_name NVARCHAR(255), unit NVARCHAR(100), created_at DATETIME DEFAULT GETDATE()); END;"
    $cmdDB.ExecuteNonQuery() | Out-Null
    Write-Host "Tables created."

    $connDB.Close()
    Write-Host "SUCCESS_ALL_DONE"
}
catch {
    Write-Host "ERROR:" $_.Exception.Message
}
