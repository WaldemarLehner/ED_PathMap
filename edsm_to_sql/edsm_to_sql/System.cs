using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace edsm_to_sql
{
    class EDSystem
    {
        public EDSystem()
        {

        }
        public EDSystem(string name, double x, double y, double z)
        {
            Name = name;
            Coordinates = new Point3D(x, y, z);
        }
        EDSystem(string name,Point3D coords)
        {

        }
        public string Name { get; set; }
        public Point3D Coordinates { get; set; }
    }

    public class Point3D
    {
        public double X { get; set; }
        public double Y { get; set; }
        public double Z { get; set; }

        public Point3D()
        {

        }
        public Point3D( double x,double y,double z)
        {

            X = x;
            Y = y;
            Z = z;
        }
    }
}
