class FloorPlanInputService {
    // Default room dimensions in square feet
    static defaultDimensions = {
      bedroom: { width: 12, length: 12 },    // 144 sqft
      bathroom: { width: 8, length: 6 },     // 48 sqft
      kitchen: { width: 12, length: 10 },    // 120 sqft
      living: { width: 16, length: 14 },     // 224 sqft
      dining: { width: 12, length: 10 },     // 120 sqft
      study: { width: 10, length: 10 }       // 100 sqft
    };
  
    static validatePlotDimensions(width, length) {
      if (width < 20 || length < 20) {
        throw new Error('Plot dimensions must be at least 20x20 square feet');
      }
      if (width > 200 || length > 200) {
        throw new Error('Plot dimensions cannot exceed 200x200 square feet');
      }
      return { width, length };
    }
  
    static validateAndProcessRooms(rooms, plotArea) {
      const processedRooms = [];
      let totalArea = 0;
  
      rooms.forEach(room => {
        // Get default dimensions if not provided
        const dimensions = room.dimensions || this.defaultDimensions[room.type];
        
        if (!dimensions) {
          throw new Error(`Invalid room type: ${room.type}`);
        }
  
        const roomArea = dimensions.width * dimensions.length;
        totalArea += roomArea;
  
        processedRooms.push({
          ...room,
          dimensions
        });
      });
  
      // Check if total room area fits within plot
      if (totalArea > (plotArea * 0.85)) { // Allowing 15% for walls and circulation
        throw new Error('Total room area exceeds plot area. Please reduce room sizes or number of rooms.');
      }
  
      return processedRooms;
    }
  
    static async processUserInput(input) {
      try {
        // Convert dimensions to feet if provided in other units
        const plotDimensions = this.validatePlotDimensions(
          input.plotWidth,
          input.plotLength
        );
  
        const plotArea = plotDimensions.width * plotDimensions.length;
  
        // Process each room
        const processedRooms = this.validateAndProcessRooms(input.rooms, plotArea);
  
        return {
          dimensions: plotDimensions,
          rooms: processedRooms,
          requirements: {
            bedrooms: processedRooms.filter(r => r.type === 'bedroom').length,
            bathrooms: processedRooms.filter(r => r.type === 'bathroom').length,
            hasKitchen: processedRooms.some(r => r.type === 'kitchen'),
            hasLivingRoom: processedRooms.some(r => r.type === 'living'),
            hasDiningRoom: processedRooms.some(r => r.type === 'dining')
          }
        };
      } catch (error) {
        throw new Error(`Input validation failed: ${error.message}`);
      }
    }
  
    // Helper function to suggest room dimensions based on plot size
    static suggestRoomDimensions(plotWidth, plotLength) {
      const plotArea = plotWidth * plotLength;
      const suggestions = {};
  
      // Scale default dimensions based on plot size
      Object.entries(this.defaultDimensions).forEach(([roomType, defaultSize]) => {
        const scaleFactor = Math.sqrt(plotArea / 2400); // 2400 sqft as reference
        suggestions[roomType] = {
          width: Math.round(defaultSize.width * scaleFactor),
          length: Math.round(defaultSize.length * scaleFactor),
          minWidth: Math.round(defaultSize.width * 0.8),
          maxWidth: Math.round(defaultSize.width * 1.2),
          minLength: Math.round(defaultSize.length * 0.8),
          maxLength: Math.round(defaultSize.length * 1.2)
        };
      });
  
      return suggestions;
    }
  }
  
  module.exports = FloorPlanInputService;