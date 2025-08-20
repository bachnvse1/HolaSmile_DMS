using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Runtime.Loader;

namespace HDMS_API.Container.DependencyInjection
{
    public sealed class CustomAssemblyLoadContext : AssemblyLoadContext
    {
        public IntPtr LoadUnmanagedLibrary(string pathOrName)
        {
            // 1) Nếu là file tồn tại -> load trực tiếp
            if (!string.IsNullOrWhiteSpace(pathOrName) && File.Exists(pathOrName))
                return LoadUnmanagedDllFromPath(pathOrName);

            // 2) Nếu là tên thư viện (không có dấu '/') -> ưu tiên name-based
            if (!string.IsNullOrWhiteSpace(pathOrName) &&
                !pathOrName.Contains(Path.DirectorySeparatorChar) &&
                !pathOrName.Contains(Path.AltDirectorySeparatorChar))
            {
                var handle = TryLoadByName(pathOrName);
                if (handle != IntPtr.Zero) return handle;
            }

            // 3) Nếu là thư mục -> dò theo OS trong thư mục
            if (!string.IsNullOrWhiteSpace(pathOrName) && Directory.Exists(pathOrName))
            {
                var handle = TryLoadFromDirectory(pathOrName);
                if (handle != IntPtr.Zero) return handle;
            }

            // 4) Thử các “điểm chuẩn” theo OS
            var fallback = GetFallbackCandidates();
            foreach (var cand in fallback)
            {
                if (File.Exists(cand))
                    return LoadUnmanagedDllFromPath(cand);
            }

            // 5) Thử theo name mặc định “wkhtmltox”
            var byName = TryLoadByName("wkhtmltox");
            if (byName != IntPtr.Zero) return byName;

            throw new FileNotFoundException("Native wkhtmltopdf (wkhtmltox) library not found.");
        }

        private IntPtr TryLoadByName(string nameOrSoname)
        {
            // Thử các biến thể tên theo OS
            var names = new List<string>();
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                names.AddRange(new[] { nameOrSoname, "wkhtmltox", "libwkhtmltox.dll", "wkhtmltox.dll" });
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                names.AddRange(new[] { nameOrSoname, "wkhtmltox", "libwkhtmltox.dylib" });
            else // Linux
                names.AddRange(new[] { nameOrSoname, "wkhtmltox", "libwkhtmltox.so", "libwkhtmltox.so.0" });

            foreach (var n in names)
            {
                try
                {
                    return NativeLibrary.Load(n);
                }
                catch { /* thử tiếp */ }
            }
            return IntPtr.Zero;
        }

        private IntPtr TryLoadFromDirectory(string dir)
        {
            string fileName =
                RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "libwkhtmltox.dll" :
                RuntimeInformation.IsOSPlatform(OSPlatform.OSX)     ? "libwkhtmltox.dylib" :
                                                                      "libwkhtmltox.so";

            // Thử cấu trúc con (nếu bạn vẫn giữ thư mục wkhtmltopdf/<os>)
            var candidates = new[]
            {
                Path.Combine(dir, fileName),
                Path.Combine(dir, "wkhtmltopdf", "windows", "libwkhtmltox.dll"),
                Path.Combine(dir, "wkhtmltopdf", "linux", "libwkhtmltox.so"),
                Path.Combine(dir, "wkhtmltopdf", "osx", "libwkhtmltox.dylib")
            };

            foreach (var c in candidates)
            {
                if (File.Exists(c))
                    return LoadUnmanagedDllFromPath(c);
            }

            // Thử file versioned trong dir
            if (Directory.Exists(dir))
            {
                foreach (var f in Directory.GetFiles(dir, "libwkhtmltox.*", SearchOption.AllDirectories))
                {
                    try { return LoadUnmanagedDllFromPath(f); } catch { }
                }
            }
            return IntPtr.Zero;
        }

        private IEnumerable<string> GetFallbackCandidates()
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                yield return "/usr/lib/x86_64-linux-gnu/libwkhtmltox.so";
                yield return "/usr/lib/x86_64-linux-gnu/libwkhtmltox.so.0";
                // Một số distro có thể đặt ở /usr/local/lib
                yield return "/usr/local/lib/libwkhtmltox.so";
                yield return "/usr/local/lib/libwkhtmltox.so.0";
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                yield return Path.Combine(Directory.GetCurrentDirectory(), "wkhtmltopdf", "libwkhtmltox.dll");
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                yield return "/usr/local/lib/libwkhtmltox.dylib";
            }
        }

        protected override IntPtr LoadUnmanagedDll(string unmanagedDllName) => IntPtr.Zero;
        protected override Assembly? Load(AssemblyName assemblyName) => null;
    }
}
