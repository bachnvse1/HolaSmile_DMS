using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HDMS_API.Application.Usecases.UserCommon.EditProfile
{
    public class EditProfileHandler : IRequestHandler<EditProfileCommand, bool>
    {
        private readonly IUserCommonRepository _repository;

        public EditProfileHandler(IUserCommonRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(EditProfileCommand request, CancellationToken cancellationToken)
        {
            return await _repository.EditProfileAsync(request, cancellationToken);
        }
    }

}
