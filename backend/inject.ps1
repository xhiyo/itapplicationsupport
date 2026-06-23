$ErrorActionPreference = 'Stop'

try {
    Write-Host "Connecting to localhost (itapplicationsupport)..."
    $connString = "Server=localhost,1433;Database=itapplicationsupport;Integrated Security=True;TrustServerCertificate=True;"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connString)
    $conn.Open()

    $cmd = $conn.CreateCommand()
    
    $cmd.CommandText = "
    INSERT INTO pic_it (pic_name, system_name, unit) VALUES
    ('Widodo', 'Retail - POS', 'Toko'),
    ('Widodo', 'Dynatools', 'Toko'),
    ('Widodo', 'Mitra', 'Toko'),
    ('Sukiman', 'SCM - Non Trade', 'HO'),
    ('Sukiman', 'SCM - SO Internal', 'HO'),
    ('Sukiman', 'SCM - Vendor Collab', 'HO'),
    ('Sukiman', 'SCM - Inventory Management', 'Toko , HO'),
    ('Sukiman', 'POS Wholesale', 'HO'),
    ('Helen', 'SCM - AR', 'HO'),
    ('Helen', 'SCM - AP', 'HO'),
    ('Helen', 'SCM - General Ledger', 'HO'),
    ('Helen', 'SCM - Non Trade', 'HO'),
    ('Helen', 'SCM - CA', 'HO'),
    ('Helen', 'Monitoring Job', 'HO'),
    ('Entus', 'SCM - CSA/ CA', 'HO'),
    ('Entus', 'GWP - Web', 'HO'),
    ('Entus', 'PIS Revamp - Web', 'HO'),
    ('Entus', 'Inventaris HW - Web', 'HO'),
    ('Entus', 'MyPZ - Web', 'HO'),
    ('Entus', 'Pre Payment - Web', 'HO'),
    ('Entus', 'Meeting - Web', 'HO'),
    ('Entus', 'Gramedia Id - Web', 'HO'),
    ('Entus', 'Elexmedia Id - Web', 'HO'),
    ('Dwi', 'SCM - Trade All Legal Entity', 'Toko,HO'),
    ('Dwi', 'SCM - CA', 'Toko,HO'),
    ('Dwi', 'SCM - Inventory Management', 'Toko,HO'),
    ('Dwi', 'SCM - Online Order', 'Toko,HO'),
    ('Dwi', 'SCM - Warehouse Management', 'HO'),
    ('Dwi', 'SCM - Sales Marketing', 'Toko,HO'),
    ('Dwi', 'Virtual Merchandising Web', 'HO'),
    ('Dwi', 'Crossdock', 'HO');
    "
    $cmd.ExecuteNonQuery() | Out-Null
    Write-Host "Data successfully injected!"

    $conn.Close()
}
catch {
    Write-Host "ERROR:" $_.Exception.Message
}
