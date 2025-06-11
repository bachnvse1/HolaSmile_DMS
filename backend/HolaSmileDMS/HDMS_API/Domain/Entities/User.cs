public class User
{
    [Key]
    public int UserId { get; set; }

    public string FullName { get; set; }
    public string Phone { get; set; }
    public string PasswordHash { get; set; }
    public string Gender { get; set; }
    public string Role { get; set; }

    public ICollection<Notification> Notifications { get; set; }
    public ICollection<SMS> SMSs { get; set; }
}
