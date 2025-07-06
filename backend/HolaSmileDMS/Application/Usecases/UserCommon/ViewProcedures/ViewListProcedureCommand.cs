using MediatR;

namespace Application.Usecases.UserCommon.ViewProcedures;

public class ViewListProcedureCommand : IRequest<List<ViewProcedureDto>> { }