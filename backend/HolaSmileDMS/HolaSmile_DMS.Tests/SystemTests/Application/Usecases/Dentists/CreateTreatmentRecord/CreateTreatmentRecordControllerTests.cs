using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using HolaSmile_DMS.Tests.Containter;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

// Aliases để tránh xung đột với entity Task trong domain
using AsyncTask = global::System.Threading.Tasks.Task;
using AsyncTaskHttpClient = global::System.Threading.Tasks.Task<System.Net.Http.HttpClient>;

namespace HolaSmile_DMS.Tests.SystemTests.Application.Usecases.Dentist
{
    [Collection("SystemTestCollection")]
    public class CreateTreatmentRecordControllerTests
    {
        private readonly CustomWebApplicationFactory<Program> _factory;

        public CreateTreatmentRecordControllerTests(CustomWebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        private async AsyncTaskHttpClient CreateAuthenticatedClient(string username, string password)
        {
            var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost:5001")
            });

            var loginPayload = new { username, password };

            var loginResponse = await client.PostAsync("/api/user/login", CreatePayload(loginPayload));
            loginResponse.EnsureSuccessStatusCode();

            var content = await loginResponse.Content.ReadAsStringAsync();
            var token = JsonDocument.Parse(content).RootElement.GetProperty("token").GetString();

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return client;
        }

        private StringContent CreatePayload(object data) =>
            new(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");

        [Fact] // STC-01
        public async AsyncTask Create_TreatmentRecord_Today_Success()
        {
            var client = await CreateAuthenticatedClient("dentist1", "123456");
            var request = new
            {
                AppointmentId = 1,
                DentistId = 1,
                ProcedureId = 5,
                TreatmentDate = DateTime.Now,
                Quantity = 2,
                UnitPrice = 500000,
                DiscountAmount = 100000,
                treatmentToday = true
            };

            var response = await client.PostAsync("/api/treatment-records", CreatePayload(request));
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[FAIL] Status: {response.StatusCode}");
                Console.WriteLine(content); // body có thể có message cụ thể
                Console.WriteLine("Authorization: " + client.DefaultRequestHeaders.Authorization?.ToString());
            }

            response.EnsureSuccessStatusCode();
            Assert.Contains("Lưu dữ liệu thành công", content);
        }

        [Fact] // STC-02
        public async AsyncTask Create_TreatmentRecord_ScheduleInFuture_Success()
        {
            var client = await CreateAuthenticatedClient("dentist1", "123456");
            var request = new
            {
                AppointmentId = 1,
                DentistId = 1,
                ProcedureId = 5,
                TreatmentDate = DateTime.Today.AddDays(3),
                Quantity = 1,
                UnitPrice = 300000,
                treatmentToday = false
            };

            var response = await client.PostAsync("/api/treatment-records", CreatePayload(request));
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("Lưu dữ liệu thành công", content);
        }

        [Fact] // STC-03
        public async AsyncTask Create_TreatmentRecord_WithoutToken_Unauthorized()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                AppointmentId = 1,
                DentistId = 2,
                ProcedureId = 5,
                TreatmentDate = DateTime.Now,
                Quantity = 1,
                UnitPrice = 100000,
                treatmentToday = true
            };

            var response = await client.PostAsync("/api/treatment-records", CreatePayload(request));
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact] // STC-04
        public async AsyncTask Create_TreatmentRecord_By_NonDentist_Forbidden()
        {
            var client = await CreateAuthenticatedClient("receptionist1", "123456");
            var request = new
            {
                AppointmentId = 1,
                DentistId = 2,
                ProcedureId = 5,
                TreatmentDate = DateTime.Now,
                Quantity = 1,
                UnitPrice = 100000,
                treatmentToday = true
            };

            var response = await client.PostAsync("/api/treatment-records", CreatePayload(request));
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact] // STC-05
        public async AsyncTask Create_TreatmentRecord_With_Invalid_TreatmentDate_Fails()
        {
            var client = await CreateAuthenticatedClient("dentist1", "123456");
            var request = new
            {
                AppointmentId = 1,
                DentistId = 2,
                ProcedureId = 5,
                TreatmentDate = DateTime.Today.AddDays(-2),
                Quantity = 1,
                UnitPrice = 100000,
                treatmentToday = false
            };

            var response = await client.PostAsync("/api/treatment-records", CreatePayload(request));
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("không thể chọn ngày trong quá khứ.", content.ToLower());
        }

        [Fact] // STC-06
        public async AsyncTask Create_TreatmentRecord_With_DiscountAmount_ExceedingTotal_Fails()
        {
            var client = await CreateAuthenticatedClient("dentist1", "123456");
            var request = new
            {
                AppointmentId = 1,
                DentistId = 2,
                ProcedureId = 5,
                TreatmentDate = DateTime.Now,
                Quantity = 1,
                UnitPrice = 100000,
                DiscountAmount = 200000,
                treatmentToday = true
            };

            var response = await client.PostAsync("/api/treatment-records", CreatePayload(request));
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("chiết khấu", content.ToLower());
        }

        [Fact] // STC-07
        public async AsyncTask Create_TreatmentRecord_With_DiscountPercentage_Over100_Fails()
        {
            var client = await CreateAuthenticatedClient("dentist1", "123456");
            var request = new
            {
                AppointmentId = 1,
                DentistId = 2,
                ProcedureId = 5,
                TreatmentDate = DateTime.Now,
                Quantity = 1,
                UnitPrice = 100000,
                DiscountPercentage = 150,
                treatmentToday = true
            };

            var response = await client.PostAsync("/api/treatment-records", CreatePayload(request));
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("chiết khấu", content.ToLower());
        }

        [Fact] // STC-08
        public async AsyncTask Create_TreatmentRecord_With_Invalid_Quantity_Or_Price_Fails()
        {
            var client = await CreateAuthenticatedClient("dentist1", "123456");
            var request = new
            {
                AppointmentId = 1,
                DentistId = 2,
                ProcedureId = 5,
                TreatmentDate = DateTime.Now,
                Quantity = 0,
                UnitPrice = -100000,
                treatmentToday = true
            };

            var response = await client.PostAsync("/api/treatment-records", CreatePayload(request));
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("số lượng không hợp lệ.", content.ToLower());
        }
    }
}