# Extract the stored GitHub credential (Git Credential Manager entry) without printing it.
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;

[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
public struct CREDENTIAL {
    public int Flags;
    public int Type;
    public string TargetName;
    public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public int CredentialBlobSize;
    public IntPtr CredentialBlob;
    public int Persist;
    public int AttributeCount;
    public IntPtr Attributes;
    public string TargetAlias;
    public string UserName;
}

public static class CredStore {
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credential);

    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool CredFree(IntPtr credential);

    public static string[] Read(string target) {
        IntPtr ptr;
        if (!CredRead(target, 1, 0, out ptr)) return null;
        try {
            CREDENTIAL c = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
            byte[] blob = new byte[c.CredentialBlobSize];
            Marshal.Copy(c.CredentialBlob, blob, 0, c.CredentialBlobSize);
            string utf16 = Encoding.Unicode.GetString(blob);
            string utf8 = Encoding.UTF8.GetString(blob);
            return new string[] { c.UserName, utf16, utf8 };
        } finally {
            CredFree(ptr);
        }
    }
}
"@

$targets = @("git:https://github.com", "gh:github.com:Pam1aos", "gh:github.com:")
foreach ($t in $targets) {
  $r = [CredStore]::Read($t)
  if ($r) {
    Write-Output "TARGET: $t"
    Write-Output "USER: $($r[0])"
    Write-Output "BLOB16_LEN: $($r[1].Length)  BLOB8_LEN: $($r[2].Length)"
    $b16 = $r[1].Trim([char]0)
    Write-Output "PREFIX16: $($b16.Substring(0, [Math]::Min(12, $b16.Length)))"
    $b8 = $r[2].Trim([char]0)
    Write-Output "PREFIX8: $($b8.Substring(0, [Math]::Min(12, $b8.Length)))"
  } else {
    Write-Output "TARGET: $t -> not found"
  }
}
