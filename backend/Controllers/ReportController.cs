using backend.Data;
using backend.Dtos.Report;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("report")]
    public class ReportController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;

        public ReportController(AppDbContext context, UserService userService)
        {
            _context = context;
            _userService = userService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetReport(int id)
        {
            var report = await _context
                .Reports.Include(r => r.Unit)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (report == null)
            {
                return BadRequest(new { message = "Rapporten kunde inte hittas i databasen" });
            }

            var result = new ReportDto
            {
                Id = report.Id,
                UnitId = report.UnitId,
                Date = report.Date,
                Hour = report.Hour,
                StartTime = report.StartTime,
                StopTime = report.StopTime,
                CategoryId = report.CategoryId,
                CategoryName = report.CategoryName,
                SubCategoryId = report.SubCategoryId,
                SubCategoryName = report.SubCategoryName,
                Content = report.Content,

                // Meta data.
                CreationDate = report.CreationDate,
                CreatedBy = report.CreatedBy,
                UpdateDate = report.UpdateDate,
                UpdatedBy = report.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpGet("{unitId}/{date}")]
        public async Task<IActionResult> GetReports(int unitId, DateOnly date)
        {
            var reports = await _context
                .Reports.Include(r => r.Unit)
                .Where(r => r.UnitId == unitId && r.Date == date)
                .ToListAsync();

            var result = reports.Select(r => new ReportDto
            {
                Id = r.Id,
                UnitId = r.UnitId,
                Date = r.Date,
                Hour = r.Hour,
                StartTime = r.StartTime,
                StopTime = r.StopTime,
                CategoryId = r.CategoryId,
                CategoryName = r.CategoryName,
                SubCategoryId = r.SubCategoryId,
                SubCategoryName = r.SubCategoryName,
                Content = r.Content,

                // Meta data.
                CreationDate = r.CreationDate,
                CreatedBy = r.CreatedBy,
                UpdateDate = r.UpdateDate,
                UpdatedBy = r.UpdatedBy,
            });

            return Ok(result);
        }

        [HttpGet("{unitId}/{date}/{hour}")]
        public async Task<IActionResult> GetReportsForHour(int unitId, DateOnly date, int hour)
        {
            var reports = await _context
                .Reports.Include(r => r.Unit)
                .Where(r => r.UnitId == unitId && r.Date == date && r.Hour == hour)
                .OrderByDescending(r => r.StartTime)
                .ToListAsync();

            var result = reports.Select(r => new ReportDto
            {
                Id = r.Id,
                UnitId = r.UnitId,
                Date = r.Date,
                Hour = r.Hour,
                StartTime = r.StartTime,
                StopTime = r.StopTime,
                CategoryId = r.CategoryId,
                CategoryName = r.CategoryName,
                SubCategoryId = r.SubCategoryId,
                SubCategoryName = r.SubCategoryName,
                Content = r.Content,

                // Meta data.
                CreationDate = r.CreationDate,
                CreatedBy = r.CreatedBy,
                UpdateDate = r.UpdateDate,
                UpdatedBy = r.UpdatedBy,
            });

            return Ok(result);
        }

        [HttpGet("range/{unitId}")]
        public async Task<IActionResult> GetReportsInRange(
            int unitId,
            [FromQuery] DateTime start,
            [FromQuery] DateTime end
        )
        {
            var reports = await _context
                .Reports.Include(r => r.Unit)
                .Where(r =>
                    r.UnitId == unitId
                    && (
                        (r.StartTime >= start && r.StartTime < end)
                        || (r.StopTime != null && r.StopTime > start && r.StopTime <= end)
                        || (r.StartTime < start && r.StopTime > end)
                    )
                )
                .ToListAsync();

            var result = reports.Select(r => new ReportDto
            {
                Id = r.Id,
                UnitId = r.UnitId,
                Date = r.Date,
                Hour = r.Hour,
                StartTime = r.StartTime,
                StopTime = r.StopTime,
                CategoryId = r.CategoryId,
                CategoryName = r.CategoryName,
                SubCategoryId = r.SubCategoryId,
                SubCategoryName = r.SubCategoryName,
                Content = r.Content,

                // Meta data.
                CreationDate = r.CreationDate,
                CreatedBy = r.CreatedBy,
                UpdateDate = r.UpdateDate,
                UpdatedBy = r.UpdatedBy,
            });

            return Ok(result);
        }

        [HttpGet("ongoing/{unitId}")]
        public async Task<IActionResult> GetOngoingReports(int unitId)
        {
            var ongoing = await _context
                .Reports.Where(r => r.UnitId == unitId && r.StopTime == null)
                .ToListAsync();

            var result = ongoing.Select(r => new ReportDto
            {
                Id = r.Id,
                UnitId = r.UnitId,
                Date = r.Date,
                Hour = r.Hour,
                StartTime = r.StartTime,
                StopTime = r.StopTime,
                CategoryId = r.CategoryId,
                CategoryName = r.CategoryName,
                SubCategoryName = r.SubCategoryName,
                Content = r.Content,

                // Meta data.
                CreationDate = r.CreationDate,
                CreatedBy = r.CreatedBy,
                UpdateDate = r.UpdateDate,
                UpdatedBy = r.UpdatedBy,
            });

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Reporter")]
        public async Task<IActionResult> DeleteReport(int id)
        {
            var report = await _context.Reports.FindAsync(id);

            if (report == null)
            {
                return NotFound(new { message = "Post kunde inte hittas i databasen" });
            }

            _context.Reports.Remove(report);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Post borttagen!" });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Reporter")]
        public async Task<IActionResult> CreateReport(CreateReportDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                return BadRequest(new { message = "Valideringsfel", errors });
            }

            var allReports = await _context
                .Reports.Where(r => r.UnitId == dto.UnitId)
                .ToListAsync();

            var validationMessage = ValidateReportTimes(allReports, dto.StartTime, dto.StopTime);

            if (validationMessage != null)
            {
                return BadRequest(new { message = validationMessage });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var categoryName = _context
                .Categories.FirstOrDefault(c => c.Id == dto.CategoryId)
                ?.Name;

            var subCategoryName = _context
                .SubCategories.FirstOrDefault(sc => sc.Id == dto.SubCategoryId)
                ?.Name;

            var report = new Report
            {
                UnitId = dto.UnitId,
                Date = dto.Date,
                Hour = dto.Hour,
                StartTime = dto.StartTime,
                StopTime = dto.StopTime,
                CategoryId = dto.CategoryId,
                SubCategoryId = dto.SubCategoryId,
                CategoryName = categoryName,
                SubCategoryName = subCategoryName,
                Content = dto.Content,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            var unit = await _context.Units.FirstOrDefaultAsync(u => u.Id == dto.UnitId);

            var result = new ReportDto
            {
                Id = report.Id,
                UnitId = report.UnitId,
                Date = report.Date,
                Hour = report.Hour,
                StartTime = report.StartTime,
                StopTime = report.StopTime,
                CategoryId = report.CategoryId,
                CategoryName = report.CategoryName,
                SubCategoryId = report.SubCategoryId,
                SubCategoryName = report.SubCategoryName,
                Content = report.Content,

                // Meta data.
                CreationDate = report.CreationDate,
                CreatedBy = report.CreatedBy,
                UpdateDate = report.UpdateDate,
                UpdatedBy = report.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Reporter")]
        public async Task<IActionResult> UpdateReport(int id, UpdateReportDto dto)
        {
            var report = await _context
                .Reports.Include(r => r.Unit)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (report == null)
            {
                return NotFound(new { message = "Post kunde inte hittas i databasen" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                return BadRequest(new { message = "Valideringsfel", errors });
            }

            var allReports = await _context
                .Reports.Where(r => r.UnitId == report.UnitId)
                .ToListAsync();

            var validationMessage = ValidateReportTimes(
                allReports,
                dto.StartTime,
                dto.StopTime,
                report.Id
            );

            if (validationMessage != null)
            {
                return BadRequest(new { message = validationMessage });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            report.CategoryId = dto.CategoryId;
            report.SubCategoryId = dto.SubCategoryId;
            report.CategoryName = _context
                .Categories.FirstOrDefault(c => c.Id == dto.CategoryId)
                ?.Name;
            report.SubCategoryName = _context
                .SubCategories.FirstOrDefault(sc => sc.Id == dto.SubCategoryId)
                ?.Name;
            report.Content = dto.Content;
            report.StartTime = dto.StartTime;
            report.StopTime = dto.StopTime;
            report.Date = dto.Date;
            report.Hour = dto.Hour;

            // Meta data.
            report.UpdateDate = now;
            report.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new ReportDto
            {
                Id = report.Id,
                UnitId = report.UnitId,
                Date = report.Date,
                Hour = report.Hour,
                StartTime = report.StartTime,
                StopTime = report.StopTime,
                CategoryId = report.CategoryId,
                CategoryName = report.CategoryName,
                SubCategoryId = report.SubCategoryId,
                SubCategoryName = report.SubCategoryName,
                Content = report.Content,

                // Meta data.
                UpdateDate = report.UpdateDate,
                UpdatedBy = report.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpGet("can-add/{unitId}/{date}/{hour}")]
        public async Task<IActionResult> CanAddReport(int unitId, DateOnly date, int hour)
        {
            var hourStart = date.ToDateTime(new TimeOnly(hour, 0));
            var hourEnd = hourStart.AddHours(1);

            var conflict = await _context
                .Reports.Where(r => r.UnitId == unitId)
                .Where(r =>
                    (!r.StopTime.HasValue && r.StartTime < hourEnd)
                    || (
                        r.StopTime.HasValue
                        && r.StartTime < hourEnd
                        && r.StopTime > hourStart
                        && !(r.StartTime < hourStart && r.StopTime <= hourEnd)
                    )
                )
                .OrderBy(r => r.StartTime)
                .FirstOrDefaultAsync();

            if (conflict != null)
            {
                return Ok(
                    new
                    {
                        canAdd = false,
                        conflictReport = new
                        {
                            id = conflict.Id,
                            startTime = conflict.StartTime,
                            stopTime = conflict.StopTime,
                            date = conflict.Date,
                            hour = conflict.Hour,
                        },
                    }
                );
            }

            return Ok(new { canAdd = true });
        }

        [HttpGet("validate-time")]
        public async Task<IActionResult> ValidateTime(
            [FromQuery] int unitId,
            [FromQuery] DateTime startTime,
            [FromQuery] DateTime? stopTime = null,
            [FromQuery] int? reportId = null
        )
        {
            var allReports = await _context.Reports.Where(r => r.UnitId == unitId).ToListAsync();

            var message = ValidateReportTimes(allReports, startTime, stopTime, reportId);

            if (message != null)
            {
                return Ok(new { isValid = false, message });
            }

            return Ok(new { isValid = true });
        }

        private string? ValidateReportTimes(
            List<Report> allReports,
            DateTime startTime,
            DateTime? stopTime = null,
            int? currentReportId = null
        )
        {
            if (stopTime.HasValue && startTime >= stopTime)
            {
                return "Sluttid måste vara senare än starttid";
            }

            if (currentReportId.HasValue)
            {
                allReports = allReports.Where(r => r.Id != currentReportId.Value).ToList();
            }

            var newStart = startTime;
            var newStop = stopTime ?? DateTime.MaxValue;

            foreach (var existing in allReports)
            {
                var existingStart = existing.StartTime;
                var existingStop = existing.StopTime ?? DateTime.MaxValue;

                bool overlaps = newStart < existingStop && newStop > existingStart;

                if (overlaps)
                {
                    return $"Stoppet får inte överlappa ett annat stopp:<br>{existingStart:yyyy-MM-dd HH:mm} - {(existing.StopTime != null ? existing.StopTime.Value.ToString("yyyy-MM-dd HH:mm") : "pågående")}";
                }
            }

            return null;
        }
    }
}
