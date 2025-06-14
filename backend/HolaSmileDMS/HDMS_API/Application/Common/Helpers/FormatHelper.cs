using System.Text.RegularExpressions;

namespace HDMS_API.Application.Common.Helpers
{
    public static class FormatHelper
    {
        public static bool FormatPhoneNumber(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return false;

            var digits = new string(input.Where(char.IsDigit).ToArray());

            if (digits.Length == 10 && digits.StartsWith("0"))
                return true;

            return false;
        }

        public static bool IsValidEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;

            var regex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
            return regex.IsMatch(email);
        }

        public static string? TryParseDob(string? dob)
        {
            if (string.IsNullOrWhiteSpace(dob)) return null;

            if (DateTime.TryParseExact(
                    dob,
                    new[] { "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "yyyy-MM-dd" },
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None,
                    out var date))
            {
                // Trả về theo định dạng dd/MM/yyyy
                return date.ToString("dd/MM/yyyy");
            }

            return null;
        }

        public static bool IsValidPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return false;

            var pattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$";
            return Regex.IsMatch(password, pattern);
        }

    }
}
