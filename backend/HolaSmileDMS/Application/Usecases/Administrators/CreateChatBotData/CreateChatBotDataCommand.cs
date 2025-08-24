using MediatR;

namespace Application.Usecases.Administrators.CreateChatBotData
{
    public class CreateChatBotDataCommand : IRequest<bool>
    {
        public string Question { get; set; }
        public string Answer { get; set; }
    }
}
