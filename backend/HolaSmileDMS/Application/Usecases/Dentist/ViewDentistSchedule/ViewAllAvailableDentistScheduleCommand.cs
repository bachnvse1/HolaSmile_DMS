﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.Dentist.ViewDentistSchedule
{
    public class ViewAllAvailableDentistScheduleCommand : IRequest<List<DentistScheduleDTO>>
    {
    }
}
