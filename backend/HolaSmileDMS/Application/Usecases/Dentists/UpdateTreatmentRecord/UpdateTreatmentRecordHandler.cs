﻿using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Dentist.UpdateTreatmentRecord
{
    public class UpdateTreatmentRecordHandler : IRequestHandler<UpdateTreatmentRecordCommand, bool>
    {
        private readonly ITreatmentRecordRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;

        public UpdateTreatmentRecordHandler(ITreatmentRecordRepository repository,
            IHttpContextAccessor httpContextAccessor,
            IMediator mediator)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _mediator = mediator;
        }

        public async Task<bool> Handle(UpdateTreatmentRecordCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (string.IsNullOrEmpty(role) ||
            (role != "Dentist" && role != "Assistant"))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            var record = await _repository.GetTreatmentRecordById(request.TreatmentRecordId, cancellationToken);
            if (record == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG27);

            if (request.ToothPosition != null)
                record.ToothPosition = request.ToothPosition;

            if (request.Quantity.HasValue)
                record.Quantity = request.Quantity.Value;

            if (request.UnitPrice.HasValue)
                record.UnitPrice = request.UnitPrice.Value;

            if (request.DiscountAmount.HasValue)
                record.DiscountAmount = request.DiscountAmount.Value;

            if (request.DiscountPercentage.HasValue)
                record.DiscountPercentage = request.DiscountPercentage.Value;

            if (request.TotalAmount.HasValue)
                record.TotalAmount = request.TotalAmount.Value;

            if (request.TreatmentStatus != null)
                record.TreatmentStatus = request.TreatmentStatus;

            if (request.Symptoms != null)
                record.Symptoms = request.Symptoms;

            if (request.Diagnosis != null)
                record.Diagnosis = request.Diagnosis;

            if (request.TreatmentDate.HasValue)
                record.TreatmentDate = request.TreatmentDate.Value;

            record.UpdatedAt = DateTime.Now;
            record.UpdatedBy = userId;

            // Gửi notification trong try/catch
            try
            {
                Console.WriteLine($"TreatmentRecord ID: {record.TreatmentRecordID}");
                Console.WriteLine($"Appointment: {(record.Appointment != null ? "exists" : "null")}");

                if (record.Appointment != null)
                {
                    Console.WriteLine($"Patient: {(record.Appointment.Patient != null ? "exists" : "null")}");

                    if (record.Appointment.Patient?.User != null)
                    {
                        var patientUserId = record.Appointment.Patient.User.UserID;
                        Console.WriteLine($"Patient User ID: {patientUserId}");

                        if (patientUserId > 0)
                        {
                            var notification = new SendNotificationCommand(
                                patientUserId,
                                "Cập nhật hồ sơ điều trị",
                                "Hồ sơ điều trị của bạn vừa được cập nhật.",
                                "Update",
                                record.TreatmentRecordID,
                                $"/patient/treatment-records"
                            );

                            await _mediator.Send(notification, cancellationToken);
                            Console.WriteLine("Notification sent successfully");
                        }
                        else
                        {
                            Console.WriteLine("Patient User ID is invalid");
                        }
                    }
                    else
                    {
                        Console.WriteLine("Patient or User is null");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in notification process:");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
            }

            return await _repository.UpdatedTreatmentRecordAsync(record, cancellationToken);
        }
    }
}
