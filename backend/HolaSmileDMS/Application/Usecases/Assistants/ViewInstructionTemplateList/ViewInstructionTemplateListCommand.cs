using MediatR;

namespace Application.Usecases.Assistants.ViewInstructionTemplateList;

public class ViewInstructionTemplateListQuery : IRequest<List<ViewInstructionTemplateDto>> { }