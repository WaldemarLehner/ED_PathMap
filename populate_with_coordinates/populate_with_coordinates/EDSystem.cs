using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace populate_with_coordinates
{
    public class EDSystem
    {
        [JsonProperty]
        string Name { get; set; }
        [JsonProperty]
        Point3D Coords { get; set; }
        public EDSystem(string name)
        {
            Name = name;
        }
        public EDSystem(string name,double x,double y,double z)
        {
            Name = name;
            Coords = new Point3D(x, y, z);
        }
        public EDSystem(string name,Point3D coords)
        {
            Name = name;
            Coords = coords;
        }
    }

    public class Point3D
    {

        public Point3D(double x,double y,double z)
        {
            X = x;
            Y = y;
            Z = z;
        }
        [JsonProperty]
        double X { get; set; }
        [JsonProperty]
        double Y { get; set; }
        [JsonProperty]
        double Z { get; set; }
     

    }
}
