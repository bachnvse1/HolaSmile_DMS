using MediatR;

namespace Application.Usecases.Dentist.ViewListReceptionistName;

public class ViewReceptionistListCommand: IRequest<List<ReceptionistRecordDto>>
{
}
