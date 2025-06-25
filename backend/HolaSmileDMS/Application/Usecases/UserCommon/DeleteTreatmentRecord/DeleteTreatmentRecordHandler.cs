using Application.Constants;
using Application.Constants.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.UserCommon.DeleteTreatmentRecord
{
    public class DeleteTreatmentRecordHandler : IRequestHandler<DeleteTreatmentRecordCommand, bool>
    {
        private readonly ITreatmentRecordRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DeleteTreatmentRecordHandler(
            ITreatmentRecordRepository repository,
            IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> Handle(DeleteTreatmentRecordCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (role != "Dentist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            return await _repository.DeleteTreatmentRecordAsync(
                request.TreatmentRecordId,
                userId,
                cancellationToken);
        }
    }
}
