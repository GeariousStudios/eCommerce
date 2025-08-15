// backend/Services/ColorHelper.cs
using System;

public static class ColorHelper
{
    public static string GetReadableTextColor(string bgHex)
    {
        if (string.IsNullOrWhiteSpace(bgHex) || bgHex.Length != 7 || bgHex[0] != '#')
        {
            return "#212121";
        }

        byte r = Convert.ToByte(bgHex.Substring(1, 2), 16);
        byte g = Convert.ToByte(bgHex.Substring(3, 2), 16);
        byte b = Convert.ToByte(bgHex.Substring(5, 2), 16);

        double R = SrgbToLinear(r / 255.0);
        double G = SrgbToLinear(g / 255.0);
        double B = SrgbToLinear(b / 255.0);
        double L = 0.2126 * R + 0.7152 * G + 0.0722 * B;

        double contrastBlack = (L + 0.05) / 0.05;
        double contrastWhite = 1.05 / (L + 0.05);

        return contrastWhite >= contrastBlack ? "#e0e0e0" : "#212121";
    }

    private static double SrgbToLinear(double c)
    {
        return c <= 0.03928 ? c / 12.92 : Math.Pow((c + 0.055) / 1.055, 2.4);
    }
}
