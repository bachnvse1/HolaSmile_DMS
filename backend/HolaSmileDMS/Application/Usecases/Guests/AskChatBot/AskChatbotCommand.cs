using MediatR;

namespace Application.Usecases.Guests.AskChatBot
{
    public class AskChatbotCommand : IRequest<string>
    {
        public string UserQuestion { get; set; }
        public AskChatbotCommand(string question)
        {
            UserQuestion = question;
        }
    }
}
