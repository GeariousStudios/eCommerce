using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models
{
    public class UserPreferences
    {
        public int Id { get; set; }
        public string Theme { get; set; } = "light";
        public int UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
