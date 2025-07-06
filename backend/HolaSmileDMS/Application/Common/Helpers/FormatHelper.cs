using System.Text.RegularExpressions;
using Application.Constants;
namespace HDMS_API.Application.Common.Helpers
{
    public static class FormatHelper
    {
        public static bool FormatPhoneNumber(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return false;

            var digits = new string(input.Where(char.IsDigit).ToArray());

            return digits.Length == 10 && digits.StartsWith("0");
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

        // ✅ Mới thêm: Tính ngày kết thúc từ thời hạn (term)
        public static DateTime ParseEndDateFromTerm(DateTime start, string term)
        {
            var lower = term.ToLower().Trim();
            var number = int.Parse(new string(term.Where(char.IsDigit).ToArray()));

            if (lower.Contains("tháng"))
                return start.AddMonths(number);
            if (lower.Contains("năm"))
                return start.AddYears(number);

            throw new FormatException(MessageConstants.MSG.MSG98);
        }
    }
}
