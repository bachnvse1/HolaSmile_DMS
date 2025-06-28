using MediatR;

namespace Application.Usecases.UserCommon.ViewListProcedure;

public class ViewListProcedureCommand : IRequest<List<ViewProcedureDto>> { }