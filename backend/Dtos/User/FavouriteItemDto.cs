namespace backend.Dtos.User
{
    public class FavouriteItemDto
    {
        public string Href { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Order { get; set; }
    }
}
